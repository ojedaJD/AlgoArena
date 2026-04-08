import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { RATING_DEFAULTS } from '@dsa/shared';
import { calculateGlicko2 } from './glicko2.js';
import type { RatingMode } from '@prisma/client';

const LEADERBOARD_KEY = 'leaderboard:global';

export class RatingService {
  /**
   * Get the user's current rating for a mode, creating a default if none exists.
   */
  async getUserRating(userId: string, mode: RatingMode = 'RANKED') {
    let rating = await prisma.rating.findUnique({
      where: { userId_mode: { userId, mode } },
    });

    if (!rating) {
      rating = await prisma.rating.create({
        data: {
          userId,
          mode,
          ratingValue: RATING_DEFAULTS.INITIAL_RATING,
          rd: RATING_DEFAULTS.INITIAL_RD,
          volatility: RATING_DEFAULTS.INITIAL_VOLATILITY,
          gamesPlayed: 0,
        },
      });
    }

    return {
      userId: rating.userId,
      mode: rating.mode,
      ratingValue: rating.ratingValue,
      rd: rating.rd,
      volatility: rating.volatility,
      gamesPlayed: rating.gamesPlayed,
      updatedAt: rating.updatedAt.toISOString(),
      isProvisional: rating.gamesPlayed < RATING_DEFAULTS.PROVISIONAL_THRESHOLD,
    };
  }

  /**
   * Update ratings for both players after a match completes.
   * Uses Glicko-2 algorithm and writes atomically in a transaction.
   */
  async updateRatings(
    matchId: string,
    winnerId: string | null,
    _loserId: string | null,
    isDraw: boolean,
    participantIds: string[],
  ): Promise<Record<string, number>> {
    if (participantIds.length !== 2) {
      logger.warn({ matchId, participantIds }, 'Cannot update ratings: need exactly 2 participants');
      return {};
    }

    const [p1Id, p2Id] = participantIds;
    const mode: RatingMode = 'RANKED';

    // Load or create ratings for both players
    const [r1, r2] = await Promise.all([
      this.getUserRating(p1Id, mode),
      this.getUserRating(p2Id, mode),
    ]);

    // Determine outcomes from p1's perspective
    let p1Outcome: number;
    if (isDraw) {
      p1Outcome = 0.5;
    } else if (winnerId === p1Id) {
      p1Outcome = 1;
    } else {
      p1Outcome = 0;
    }

    // Calculate new ratings via Glicko-2
    const newR1 = calculateGlicko2(
      { rating: r1.ratingValue, rd: r1.rd, volatility: r1.volatility },
      { rating: r2.ratingValue, rd: r2.rd, volatility: r2.volatility },
      p1Outcome,
      RATING_DEFAULTS.SYSTEM_TAU,
    );

    const newR2 = calculateGlicko2(
      { rating: r2.ratingValue, rd: r2.rd, volatility: r2.volatility },
      { rating: r1.ratingValue, rd: r1.rd, volatility: r1.volatility },
      1 - p1Outcome,
      RATING_DEFAULTS.SYSTEM_TAU,
    );

    // Clamp RD within bounds
    newR1.rd = Math.max(RATING_DEFAULTS.MIN_RD, Math.min(RATING_DEFAULTS.MAX_RD, newR1.rd));
    newR2.rd = Math.max(RATING_DEFAULTS.MIN_RD, Math.min(RATING_DEFAULTS.MAX_RD, newR2.rd));

    const ratingDelta: Record<string, number> = {
      [p1Id]: Math.round(newR1.rating - r1.ratingValue),
      [p2Id]: Math.round(newR2.rating - r2.ratingValue),
    };

    // Write everything atomically in a transaction
    await prisma.$transaction([
      // Update player 1 rating
      prisma.rating.update({
        where: { userId_mode: { userId: p1Id, mode } },
        data: {
          ratingValue: newR1.rating,
          rd: newR1.rd,
          volatility: newR1.volatility,
          gamesPlayed: { increment: 1 },
        },
      }),
      // Update player 2 rating
      prisma.rating.update({
        where: { userId_mode: { userId: p2Id, mode } },
        data: {
          ratingValue: newR2.rating,
          rd: newR2.rd,
          volatility: newR2.volatility,
          gamesPlayed: { increment: 1 },
        },
      }),
      // Append rating history for player 1
      prisma.ratingHistory.create({
        data: {
          userId: p1Id,
          matchId,
          ratingBefore: r1.ratingValue,
          ratingAfter: newR1.rating,
          rdBefore: r1.rd,
          rdAfter: newR1.rd,
        },
      }),
      // Append rating history for player 2
      prisma.ratingHistory.create({
        data: {
          userId: p2Id,
          matchId,
          ratingBefore: r2.ratingValue,
          ratingAfter: newR2.rating,
          rdBefore: r2.rd,
          rdAfter: newR2.rd,
        },
      }),
      // Store rating delta on the match for quick access
      prisma.match.update({
        where: { id: matchId },
        data: { ratingDelta },
      }),
    ]);

    // Update Redis leaderboard
    const pipeline = redis.pipeline();
    pipeline.zadd(LEADERBOARD_KEY, Math.round(newR1.rating), p1Id);
    pipeline.zadd(LEADERBOARD_KEY, Math.round(newR2.rating), p2Id);
    await pipeline.exec();

    logger.info(
      {
        matchId,
        p1Id,
        p2Id,
        p1Delta: ratingDelta[p1Id],
        p2Delta: ratingDelta[p2Id],
      },
      'Ratings updated',
    );

    return ratingDelta;
  }

  /**
   * Get rating history entries for a user, ordered newest first.
   */
  async getRatingHistory(userId: string, limit: number = 50) {
    const history = await prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        matchId: true,
        ratingBefore: true,
        ratingAfter: true,
        rdBefore: true,
        rdAfter: true,
        createdAt: true,
      },
    });

    return history.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    }));
  }
}

export const ratingService = new RatingService();
