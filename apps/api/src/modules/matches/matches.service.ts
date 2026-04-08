import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../lib/errors.js';
import { LIMITS, RATING_DEFAULTS } from '@dsa/shared';
import { MatchStateMachine } from './match-state-machine.js';
import type { MatchMode } from '@prisma/client';

// ── Redis key helpers ─────────────────────────────────────────────────

const QUEUE_KEY = (mode: string) => `matchmaking:queue:${mode}`;
const QUEUE_JOIN_TIME_KEY = (mode: string) => `matchmaking:jointime:${mode}`;
const USER_QUEUE_KEY = (userId: string) => `matchmaking:user:${userId}`;

export class MatchService {
  /**
   * Add a user to the matchmaking queue (sorted set keyed by rating).
   * Immediately attempts to find a match.
   */
  async joinQueue(userId: string, mode: string): Promise<{ matchId: string } | null> {
    // Check if already in a queue
    const existingQueue = await redis.get(USER_QUEUE_KEY(userId));
    if (existingQueue) {
      throw new ConflictError('Already in a matchmaking queue');
    }

    // Get user rating for the mode
    const rating = await this.getUserRatingValue(userId);

    const queueKey = QUEUE_KEY(mode);
    const joinTimeKey = QUEUE_JOIN_TIME_KEY(mode);

    // Add to sorted set (score = rating) and record join timestamp
    await redis.zadd(queueKey, rating, userId);
    await redis.hset(joinTimeKey, userId, Date.now().toString());
    await redis.set(USER_QUEUE_KEY(userId), mode, 'EX', LIMITS.MATCHMAKING_TIMEOUT_MS / 1000);

    logger.info({ userId, mode, rating }, 'Player joined matchmaking queue');

    // Try to find a match right now
    const match = await this.findMatch(userId, mode, rating);
    if (match) {
      return { matchId: match.id };
    }

    // Set auto-expire: remove from queue after timeout
    // (The USER_QUEUE_KEY TTL already handles user-side cleanup.)
    return null;
  }

  /**
   * Remove a user from the matchmaking queue.
   */
  async leaveQueue(userId: string): Promise<void> {
    const mode = await redis.get(USER_QUEUE_KEY(userId));
    if (!mode) return;

    await redis.zrem(QUEUE_KEY(mode), userId);
    await redis.hdel(QUEUE_JOIN_TIME_KEY(mode), userId);
    await redis.del(USER_QUEUE_KEY(userId));

    logger.info({ userId, mode }, 'Player left matchmaking queue');
  }

  /**
   * Attempt to find a compatible opponent in the queue.
   * The acceptable rating range widens over time.
   */
  async findMatch(
    userId: string,
    mode: string,
    userRating: number,
  ): Promise<{ id: string } | null> {
    const queueKey = QUEUE_KEY(mode);
    const joinTimeKey = QUEUE_JOIN_TIME_KEY(mode);

    // Determine how long this user has been waiting
    const joinTimeStr = await redis.hget(joinTimeKey, userId);
    const joinTime = joinTimeStr ? parseInt(joinTimeStr, 10) : Date.now();
    const waitSec = (Date.now() - joinTime) / 1000;

    // Widen the rating range over time
    const range = Math.min(
      LIMITS.MATCHMAKING_INITIAL_RANGE + waitSec * LIMITS.MATCHMAKING_RANGE_EXPANSION_PER_SEC,
      LIMITS.MATCHMAKING_MAX_RANGE,
    );

    const minRating = userRating - range;
    const maxRating = userRating + range;

    // Find players within the rating range
    const candidates = await redis.zrangebyscore(queueKey, minRating, maxRating);
    const opponent = candidates.find((id) => id !== userId);

    if (!opponent) return null;

    // Remove both from queue atomically
    const pipeline = redis.pipeline();
    pipeline.zrem(queueKey, userId);
    pipeline.zrem(queueKey, opponent);
    pipeline.hdel(joinTimeKey, userId);
    pipeline.hdel(joinTimeKey, opponent);
    pipeline.del(USER_QUEUE_KEY(userId));
    pipeline.del(USER_QUEUE_KEY(opponent));
    await pipeline.exec();

    // Create the match
    const match = await this.createMatch(userId, opponent, mode as MatchMode);

    // Notify both players via Redis pub/sub
    await redis.publish(
      'matchmaking:found',
      JSON.stringify({ matchId: match.id, players: [userId, opponent] }),
    );

    return { id: match.id };
  }

  /**
   * Create a match between two players with a random problem.
   */
  async createMatch(
    player1Id: string,
    player2Id: string,
    mode: MatchMode,
  ): Promise<{ id: string; problemSlug: string | null }> {
    // Pick a random published problem (may be null for placeholder matches)
    const problemCount = await prisma.problem.count({ where: { isPublished: true } });
    let problem: { id: string; slug: string } | null = null;
    if (problemCount > 0) {
      const skip = Math.floor(Math.random() * problemCount);
      problem = await prisma.problem.findFirst({
        where: { isPublished: true },
        skip,
        select: { id: true, slug: true },
      });
    }

    // Get ratings for both players
    const [r1, r2] = await Promise.all([
      this.getUserRatingValue(player1Id),
      this.getUserRatingValue(player2Id),
    ]);

    // Create match + participants in a transaction
    // problemId may be null if no published problems exist (placeholder match)
    const match = await prisma.match.create({
      data: {
        mode,
        status: 'WAITING',
        problemId: problem?.id ?? null,
        participants: {
          create: [
            { userId: player1Id, ratingAtMatch: r1 },
            { userId: player2Id, ratingAtMatch: r2 },
          ],
        },
      },
      select: { id: true },
    });

    // Initialize the state machine in Redis
    await MatchStateMachine.create(match.id, problem?.id ?? null, problem?.slug ?? null);

    logger.info(
      { matchId: match.id, player1Id, player2Id, mode, problemSlug: problem?.slug ?? null },
      'Match created',
    );

    return { id: match.id, problemSlug: problem?.slug ?? null };
  }

  /**
   * Create a friend challenge (FRIEND mode match).
   */
  async createChallenge(
    userId: string,
    friendUserId: string,
  ): Promise<{ id: string }> {
    if (userId === friendUserId) {
      throw new ConflictError('Cannot challenge yourself');
    }

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendUserId, status: 'ACCEPTED' },
          { userId: friendUserId, friendUserId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenError('You can only challenge friends');
    }

    // Pick random problem (may be null for placeholder matches)
    const problemCount = await prisma.problem.count({ where: { isPublished: true } });
    let problem: { id: string; slug: string } | null = null;
    if (problemCount > 0) {
      const skip = Math.floor(Math.random() * problemCount);
      problem = await prisma.problem.findFirst({
        where: { isPublished: true },
        skip,
        select: { id: true, slug: true },
      });
    }

    const r1 = await this.getUserRatingValue(userId);

    // Create match with only the challenger as participant initially
    const match = await prisma.match.create({
      data: {
        mode: 'FRIEND',
        status: 'WAITING',
        problemId: problem?.id ?? null,
        participants: {
          create: [{ userId, ratingAtMatch: r1 }],
        },
      },
      select: { id: true },
    });

    await MatchStateMachine.create(match.id, problem?.id ?? null, problem?.slug ?? null);

    // Notify the friend via Redis pub/sub
    await redis.publish(
      `user:${friendUserId}:notification`,
      JSON.stringify({
        type: 'match_challenge',
        title: 'Match Challenge',
        body: 'You have been challenged to a match!',
        refType: 'match',
        refId: match.id,
      }),
    );

    return { id: match.id };
  }

  /**
   * Accept a friend challenge. Adds the user as the second participant.
   */
  async acceptChallenge(matchId: string, userId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.mode !== 'FRIEND') {
      throw new ConflictError('Can only accept friend challenges');
    }

    if (match.status !== 'WAITING') {
      throw new ConflictError('Match is no longer waiting for players');
    }

    if (match.participants.some((p) => p.userId === userId)) {
      throw new ConflictError('You are already in this match');
    }

    if (match.participants.length >= 2) {
      throw new ConflictError('Match is full');
    }

    const rating = await this.getUserRatingValue(userId);

    await prisma.matchParticipant.create({
      data: {
        matchId,
        userId,
        ratingAtMatch: rating,
      },
    });

    // Load state machine and add participant — this triggers ready check
    const machine = await MatchStateMachine.loadState(matchId);
    if (machine) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { displayName: true },
      });
      await machine.addParticipant(userId, profile?.displayName ?? 'Anonymous');
    }
  }

  /**
   * Get a match by ID with all participants.
   */
  async getMatch(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        problem: { select: { id: true, slug: true, title: true, difficulty: true } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    return match;
  }

  /**
   * Get paginated match history for a user.
   */
  async getUserMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: {
          participants: { some: { userId } },
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                },
              },
            },
          },
          problem: { select: { slug: true, title: true, difficulty: true } },
        },
        orderBy: { endedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.match.count({
        where: {
          participants: { some: { userId } },
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    return {
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async getUserRatingValue(userId: string): Promise<number> {
    const rating = await prisma.rating.findFirst({
      where: { userId, mode: 'RANKED' },
      select: { ratingValue: true },
    });
    return rating?.ratingValue ?? RATING_DEFAULTS.INITIAL_RATING;
  }
}

export const matchService = new MatchService();
