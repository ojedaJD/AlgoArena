import { redis } from '../../config/redis.js';
import { prisma } from '../../config/prisma.js';
import { logger } from '../../lib/logger.js';
import { LIMITS } from '@dsa/shared';
import type { MatchRoomState } from '@dsa/shared';
import type { MatchStatus as PrismaMatchStatus } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────

type MatchState = 'WAITING' | 'READY_CHECK' | 'CODING' | 'JUDGING' | 'COMPLETED' | 'CANCELLED';

interface ParticipantState {
  userId: string;
  displayName: string;
  ready: boolean;
  submitted: boolean;
  submissionId: string | null;
  verdict: string | null;
}

interface PersistedState {
  matchId: string;
  state: MatchState;
  problemId: string | null;
  problemSlug: string | null;
  participants: ParticipantState[];
  codingStartedAt: number | null;
  codingEndsAt: number | null;
  readyCheckStartedAt: number | null;
  cancelReason: string | null;
}

// Valid transitions keyed by current state
const VALID_TRANSITIONS: Record<MatchState, MatchState[]> = {
  WAITING: ['READY_CHECK', 'CANCELLED'],
  READY_CHECK: ['CODING', 'CANCELLED'],
  CODING: ['JUDGING', 'CANCELLED'],
  JUDGING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const STATE_KEY_PREFIX = 'match:state:';
const STATE_TTL = 60 * 60 * 2; // 2 hours auto-cleanup

// ── State Machine ─────────────────────────────────────────────────────

export class MatchStateMachine {
  private matchId: string;
  private state: MatchState;
  private problemId: string | null;
  private problemSlug: string | null;
  private participants: ParticipantState[];
  private codingStartedAt: number | null;
  private codingEndsAt: number | null;
  private readyCheckStartedAt: number | null;
  private cancelReason: string | null;
  private timer: NodeJS.Timeout | null = null;

  constructor(matchId: string, initial?: Partial<PersistedState>) {
    this.matchId = matchId;
    this.state = initial?.state ?? 'WAITING';
    this.problemId = initial?.problemId ?? null;
    this.problemSlug = initial?.problemSlug ?? null;
    this.participants = initial?.participants ?? [];
    this.codingStartedAt = initial?.codingStartedAt ?? null;
    this.codingEndsAt = initial?.codingEndsAt ?? null;
    this.readyCheckStartedAt = initial?.readyCheckStartedAt ?? null;
    this.cancelReason = initial?.cancelReason ?? null;
  }

  // ── Public API ────────────────────────────────────────────────────

  get currentState(): MatchState {
    return this.state;
  }

  get id(): string {
    return this.matchId;
  }

  /**
   * Transition to a new state. Validates the transition is legal.
   */
  async transition(targetState: MatchState, data?: Record<string, unknown>): Promise<void> {
    if (!VALID_TRANSITIONS[this.state].includes(targetState)) {
      throw new Error(
        `Invalid transition: ${this.state} -> ${targetState} for match ${this.matchId}`,
      );
    }

    const previousState = this.state;
    this.state = targetState;

    logger.info(
      { matchId: this.matchId, from: previousState, to: targetState, data },
      'Match state transition',
    );

    await this.saveState();
    await this.broadcast('match:state', this.toRoomState());
  }

  /**
   * Add a participant to the match. If two players are present, start ready check.
   */
  async addParticipant(userId: string, displayName: string): Promise<void> {
    if (this.participants.find((p) => p.userId === userId)) {
      return; // already joined
    }

    this.participants.push({
      userId,
      displayName,
      ready: false,
      submitted: false,
      submissionId: null,
      verdict: null,
    });

    await this.saveState();

    if (this.participants.length === 2 && this.state === 'WAITING') {
      await this.startReadyCheck();
    }
  }

  /**
   * Start the ready-check phase. Both players have 15 seconds to confirm.
   */
  async startReadyCheck(): Promise<void> {
    await this.transition('READY_CHECK');
    this.readyCheckStartedAt = Date.now();
    await this.saveState();

    // Auto-cancel if not both ready within the timeout
    this.clearTimer();
    this.timer = setTimeout(async () => {
      try {
        if (this.state === 'READY_CHECK') {
          const notReady = this.participants
            .filter((p) => !p.ready)
            .map((p) => p.displayName)
            .join(', ');
          await this.cancel(`Ready check timed out. Not ready: ${notReady}`);
        }
      } catch (err) {
        logger.error({ err, matchId: this.matchId }, 'Error in ready-check timeout');
      }
    }, LIMITS.MATCH_READY_CHECK_MS);
  }

  /**
   * Mark a player as ready. If both are ready, start coding.
   */
  async playerReady(userId: string): Promise<void> {
    if (this.state !== 'READY_CHECK') {
      throw new Error(`Cannot ready up in state ${this.state}`);
    }

    const participant = this.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error(`Player ${userId} is not in match ${this.matchId}`);
    }

    participant.ready = true;
    await this.saveState();
    await this.broadcast('match:state', this.toRoomState());

    if (this.participants.every((p) => p.ready)) {
      this.clearTimer();
      await this.startCoding();
    }
  }

  /**
   * Begin the coding phase. Timer starts.
   */
  async startCoding(): Promise<void> {
    await this.transition('CODING');

    const now = Date.now();
    this.codingStartedAt = now;
    this.codingEndsAt = now + LIMITS.MATCH_DURATION_MS;

    // Update DB start time
    await prisma.match.update({
      where: { id: this.matchId },
      data: { status: 'CODING', startedAt: new Date(now) },
    });

    await this.saveState();

    // Auto-transition to JUDGING when time runs out
    this.clearTimer();
    this.timer = setTimeout(async () => {
      try {
        if (this.state === 'CODING') {
          await this.startJudging();
        }
      } catch (err) {
        logger.error({ err, matchId: this.matchId }, 'Error in coding timeout');
      }
    }, LIMITS.MATCH_DURATION_MS);
  }

  /**
   * Record that a player has submitted code.
   */
  async playerSubmitted(userId: string, submissionId: string): Promise<void> {
    if (this.state !== 'CODING' && this.state !== 'JUDGING') {
      throw new Error(`Cannot submit in state ${this.state}`);
    }

    const participant = this.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error(`Player ${userId} is not in match ${this.matchId}`);
    }

    participant.submitted = true;
    participant.submissionId = submissionId;

    // Link submission to participant in DB
    await prisma.matchParticipant.updateMany({
      where: { matchId: this.matchId, userId },
      data: { submissionId },
    });

    await this.saveState();

    // Notify opponent that this player submitted (without revealing code)
    await this.broadcast('match:opponent_submitted', { userId });

    // If both have submitted, start judging immediately
    if (this.participants.every((p) => p.submitted) && this.state === 'CODING') {
      this.clearTimer();
      await this.startJudging();
    }
  }

  /**
   * Update the verdict for a player's submission (called after judge completes).
   */
  async updateVerdict(userId: string, verdict: string): Promise<void> {
    const participant = this.participants.find((p) => p.userId === userId);
    if (!participant) return;

    participant.verdict = verdict;
    await this.saveState();

    await this.broadcast('match:opponent_verdict', { userId, verdict });

    // If all submitted participants have verdicts, resolve the match
    const submittedParticipants = this.participants.filter((p) => p.submitted);
    if (
      this.state === 'JUDGING' &&
      submittedParticipants.every((p) => p.verdict !== null)
    ) {
      await this.resolveWinner();
    }
  }

  /**
   * Transition to JUDGING phase.
   */
  async startJudging(): Promise<void> {
    await this.transition('JUDGING');

    await prisma.match.update({
      where: { id: this.matchId },
      data: { status: 'JUDGING' },
    });

    await this.saveState();

    // If no submissions at all, resolve immediately
    const anySubmitted = this.participants.some((p) => p.submitted);
    if (!anySubmitted) {
      await this.resolveWinner();
      return;
    }

    // If all submitted players already have verdicts (instant judge), resolve now
    const submittedParticipants = this.participants.filter((p) => p.submitted);
    if (submittedParticipants.every((p) => p.verdict !== null)) {
      await this.resolveWinner();
      return;
    }

    // Safety: auto-resolve after 2 minutes if judge hangs
    this.clearTimer();
    this.timer = setTimeout(async () => {
      try {
        if (this.state === 'JUDGING') {
          await this.resolveWinner();
        }
      } catch (err) {
        logger.error({ err, matchId: this.matchId }, 'Error in judging timeout');
      }
    }, 2 * 60 * 1000);
  }

  /**
   * Determine and record the winner.
   *
   * Resolution logic:
   * 1. If one ACCEPTED, other not -> ACCEPTED player wins.
   * 2. If both ACCEPTED -> faster submission wins.
   * 3. If neither ACCEPTED -> more test cases passed wins, then faster.
   * 4. If still tied -> draw.
   */
  async resolveWinner(): Promise<void> {
    this.clearTimer();

    const [p1, p2] = this.participants;
    if (!p1 || !p2) {
      await this.cancel('Not enough participants to resolve');
      return;
    }

    // Load full submission data from DB
    const submissions = await prisma.submission.findMany({
      where: {
        id: {
          in: [p1.submissionId, p2.submissionId].filter(Boolean) as string[],
        },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        passedCases: true,
        totalCases: true,
        createdAt: true,
      },
    });

    const sub1 = submissions.find((s) => s.userId === p1.userId) ?? null;
    const sub2 = submissions.find((s) => s.userId === p2.userId) ?? null;

    let winnerId: string | null = null;

    if (!sub1 && !sub2) {
      // Neither submitted — draw
      winnerId = null;
    } else if (sub1 && !sub2) {
      winnerId = p1.userId;
    } else if (!sub1 && sub2) {
      winnerId = p2.userId;
    } else if (sub1 && sub2) {
      const s1Accepted = sub1.status === 'ACCEPTED';
      const s2Accepted = sub2.status === 'ACCEPTED';

      if (s1Accepted && !s2Accepted) {
        winnerId = p1.userId;
      } else if (!s1Accepted && s2Accepted) {
        winnerId = p2.userId;
      } else if (s1Accepted && s2Accepted) {
        // Both accepted — faster wins
        if (sub1.createdAt < sub2.createdAt) {
          winnerId = p1.userId;
        } else if (sub2.createdAt < sub1.createdAt) {
          winnerId = p2.userId;
        } else {
          winnerId = null; // exact same time — draw
        }
      } else {
        // Neither accepted — compare test cases
        if (sub1.passedCases > sub2.passedCases) {
          winnerId = p1.userId;
        } else if (sub2.passedCases > sub1.passedCases) {
          winnerId = p2.userId;
        } else {
          // Same cases — faster wins
          if (sub1.createdAt < sub2.createdAt) {
            winnerId = p1.userId;
          } else if (sub2.createdAt < sub1.createdAt) {
            winnerId = p2.userId;
          } else {
            winnerId = null;
          }
        }
      }
    }

    // Update match in DB
    await prisma.match.update({
      where: { id: this.matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        endedAt: new Date(),
      },
    });

    await this.transition('COMPLETED');

    await this.broadcast('match:ended', {
      winnerId,
      reason: winnerId ? 'Winner determined' : 'Draw',
    });

    // Publish event for ratings service to consume
    await redis.publish(
      'match:completed',
      JSON.stringify({
        matchId: this.matchId,
        winnerId,
        participants: this.participants.map((p) => p.userId),
      }),
    );

    // Clean up timer state (the Redis key will TTL out)
  }

  /**
   * Cancel the match from any state.
   */
  async cancel(reason: string): Promise<void> {
    this.clearTimer();
    this.cancelReason = reason;

    const previousState = this.state;
    this.state = 'CANCELLED';

    await prisma.match.update({
      where: { id: this.matchId },
      data: { status: 'CANCELLED', endedAt: new Date() },
    });

    await this.saveState();

    logger.info(
      { matchId: this.matchId, from: previousState, reason },
      'Match cancelled',
    );

    await this.broadcast('match:cancelled', { reason });
  }

  /**
   * Build the room state snapshot for clients.
   */
  toRoomState(): MatchRoomState {
    const now = Date.now();
    let timeRemainingMs = 0;

    if (this.state === 'READY_CHECK' && this.readyCheckStartedAt) {
      timeRemainingMs = Math.max(
        0,
        LIMITS.MATCH_READY_CHECK_MS - (now - this.readyCheckStartedAt),
      );
    } else if (
      (this.state === 'CODING' || this.state === 'JUDGING') &&
      this.codingEndsAt
    ) {
      timeRemainingMs = Math.max(0, this.codingEndsAt - now);
    }

    return {
      matchId: this.matchId,
      status: this.state,
      problemSlug: this.problemSlug,
      timeRemainingMs,
      participants: this.participants.map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        ready: p.ready,
        submitted: p.submitted,
        verdict: p.verdict,
      })),
    };
  }

  // ── Persistence ───────────────────────────────────────────────────

  /**
   * Broadcast an event to all sockets in the match room via Redis pub/sub.
   */
  private async broadcast(event: string, data: unknown): Promise<void> {
    await redis.publish(
      `match:room:${this.matchId}`,
      JSON.stringify({ event, data }),
    );
  }

  /**
   * Save the full state machine state to Redis with a TTL.
   */
  private async saveState(): Promise<void> {
    const payload: PersistedState = {
      matchId: this.matchId,
      state: this.state,
      problemId: this.problemId,
      problemSlug: this.problemSlug,
      participants: this.participants,
      codingStartedAt: this.codingStartedAt,
      codingEndsAt: this.codingEndsAt,
      readyCheckStartedAt: this.readyCheckStartedAt,
      cancelReason: this.cancelReason,
    };

    await redis.set(
      `${STATE_KEY_PREFIX}${this.matchId}`,
      JSON.stringify(payload),
      'EX',
      STATE_TTL,
    );
  }

  /**
   * Load a state machine from Redis. Returns null if not found.
   */
  static async loadState(matchId: string): Promise<MatchStateMachine | null> {
    const raw = await redis.get(`${STATE_KEY_PREFIX}${matchId}`);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as PersistedState;
      return new MatchStateMachine(matchId, data);
    } catch {
      logger.error({ matchId }, 'Failed to parse match state from Redis');
      return null;
    }
  }

  /**
   * Create a fresh state machine and persist it.
   */
  static async create(
    matchId: string,
    problemId: string | null,
    problemSlug: string | null,
  ): Promise<MatchStateMachine> {
    const machine = new MatchStateMachine(matchId, {
      state: 'WAITING',
      problemId,
      problemSlug,
      participants: [],
    });
    await machine.saveState();
    return machine;
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
