import { redis } from '../../config/redis.js';
import { prisma } from '../../config/prisma.js';

const LEADERBOARD_KEY = 'leaderboard:global';

export class LeaderboardService {
  /**
   * Update a user's score in the global leaderboard (Redis ZSET).
   */
  async updateScore(userId: string, score: number): Promise<void> {
    await redis.zadd(LEADERBOARD_KEY, score, userId);
  }

  /**
   * Get the global leaderboard, highest scores first.
   * Returns user IDs with scores, enriched with profile data from DB.
   */
  async getGlobalTop(limit: number = 50, offset: number = 0) {
    // ZREVRANGEBYSCORE returns highest first; use ZREVRANGE with WITHSCORES
    const raw = await redis.zrevrange(
      LEADERBOARD_KEY,
      offset,
      offset + limit - 1,
      'WITHSCORES',
    );

    // raw is [userId, score, userId, score, ...]
    const entries: { userId: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({
        userId: raw[i],
        score: parseFloat(raw[i + 1]),
      });
    }

    if (entries.length === 0) return [];

    // Enrich with profile data
    const userIds = entries.map((e) => e.userId);
    const profiles = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        profile: {
          select: { displayName: true, avatarUrl: true },
        },
      },
    });

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return entries.map((entry, index) => {
      const profile = profileMap.get(entry.userId);
      return {
        rank: offset + index + 1,
        userId: entry.userId,
        displayName: profile?.profile?.displayName ?? 'Anonymous',
        avatarUrl: profile?.profile?.avatarUrl ?? null,
        rating: entry.score,
      };
    });
  }

  /**
   * Get a user's rank and score on the global leaderboard.
   */
  async getUserRank(
    userId: string,
  ): Promise<{ rank: number | null; rating: number | null }> {
    const [rank, score] = await Promise.all([
      redis.zrevrank(LEADERBOARD_KEY, userId),
      redis.zscore(LEADERBOARD_KEY, userId),
    ]);

    return {
      rank: rank !== null ? rank + 1 : null,
      rating: score !== null ? parseFloat(score) : null,
    };
  }

  /**
   * Get a leaderboard scoped to a set of friend IDs (plus the user).
   */
  async getFriendsLeaderboard(userId: string, friendIds: string[]) {
    const allIds = [userId, ...friendIds];

    // Get scores for all friends from Redis
    const pipeline = redis.pipeline();
    for (const id of allIds) {
      pipeline.zscore(LEADERBOARD_KEY, id);
    }
    const results = await pipeline.exec();

    const entries: { userId: string; score: number }[] = [];
    if (results) {
      for (let i = 0; i < allIds.length; i++) {
        const [err, score] = results[i] as [Error | null, string | null];
        if (!err && score !== null) {
          entries.push({ userId: allIds[i], score: parseFloat(score) });
        }
      }
    }

    // Sort descending by score
    entries.sort((a, b) => b.score - a.score);

    // Enrich with profiles
    const userIds = entries.map((e) => e.userId);
    const profiles = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        profile: {
          select: { displayName: true, avatarUrl: true },
        },
      },
    });

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return entries.map((entry, index) => {
      const profile = profileMap.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        displayName: profile?.profile?.displayName ?? 'Anonymous',
        avatarUrl: profile?.profile?.avatarUrl ?? null,
        rating: entry.score,
        isMe: entry.userId === userId,
      };
    });
  }

  /**
   * Rebuild the leaderboard from the database (useful for cold-start or repair).
   */
  async rebuild(): Promise<number> {
    const ratings = await prisma.rating.findMany({
      where: { mode: 'RANKED' },
      select: { userId: true, ratingValue: true },
    });

    if (ratings.length === 0) return 0;

    const pipeline = redis.pipeline();
    pipeline.del(LEADERBOARD_KEY);
    for (const r of ratings) {
      pipeline.zadd(LEADERBOARD_KEY, Math.round(r.ratingValue), r.userId);
    }
    await pipeline.exec();

    return ratings.length;
  }
}

export const leaderboardService = new LeaderboardService();
