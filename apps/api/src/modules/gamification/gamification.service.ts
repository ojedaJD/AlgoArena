import { prisma } from '../../config/prisma.js';
import { logger } from '../../lib/logger.js';
import { getLevelFromXp } from '@dsa/shared';
import { calculateXp, type XpAction } from './xp-engine.js';
import { computeStreak } from './streak-engine.js';

export class GamificationService {
  /**
   * Award XP to a user. Inserts a row in xp_ledger and returns the new total.
   */
  async awardXp(
    userId: string,
    action: XpAction,
    reason: string,
    refType?: string,
    refId?: string,
    context?: { currentStreak?: number },
  ): Promise<{ delta: number; totalXp: number }> {
    const delta = calculateXp(action, context);

    if (delta <= 0) return { delta: 0, totalXp: await this.getTotalXp(userId) };

    await prisma.xpLedger.create({
      data: {
        userId,
        delta,
        reason,
        refType: refType ?? null,
        refId: refId ?? null,
      },
    });

    const totalXp = await this.getTotalXp(userId);

    logger.debug({ userId, action, delta, totalXp }, 'XP awarded');

    return { delta, totalXp };
  }

  /**
   * Get the full progress snapshot for a user.
   */
  async getProgress(userId: string) {
    const [
      totalXp,
      streak,
      problemsSolved,
      matchesPlayed,
      matchesWon,
      achievements,
    ] = await Promise.all([
      this.getTotalXp(userId),
      prisma.userStreak.findUnique({ where: { userId } }),
      prisma.submission.count({
        where: { userId, status: 'ACCEPTED' },
      }),
      prisma.matchParticipant.count({
        where: {
          userId,
          match: { status: 'COMPLETED' },
        },
      }),
      prisma.match.count({
        where: { winnerId: userId, status: 'COMPLETED' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    const { level, xpToNext } = getLevelFromXp(totalXp);

    return {
      userId,
      totalXp,
      level,
      xpToNextLevel: xpToNext,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      problemsSolved,
      matchesPlayed,
      matchesWon,
      achievements: achievements.map((ua) => ({
        id: ua.id,
        userId: ua.userId,
        achievementId: ua.achievementId,
        unlockedAt: ua.unlockedAt.toISOString(),
        achievement: {
          slug: ua.achievement.slug,
          title: ua.achievement.title,
          description: ua.achievement.description,
          iconUrl: ua.achievement.iconUrl,
        },
      })),
    };
  }

  /**
   * Check and update the user's daily streak.
   * Returns the updated streak and whether XP was awarded.
   */
  async checkAndUpdateStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    xpAwarded: number;
  }> {
    // Upsert streak record
    let streakRecord = await prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streakRecord) {
      streakRecord = await prisma.userStreak.create({
        data: { userId, currentStreak: 0, longestStreak: 0 },
      });
    }

    const result = computeStreak({
      currentStreak: streakRecord.currentStreak,
      longestStreak: streakRecord.longestStreak,
      lastActivityDate: streakRecord.lastActivityDate,
    });

    if (!result.changed) {
      return {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        xpAwarded: 0,
      };
    }

    // Update in DB
    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastActivityDate: result.lastActivityDate,
      },
    });

    // Award streak bonus XP
    const { delta } = await this.awardXp(
      userId,
      'STREAK_BONUS',
      `Day ${result.currentStreak} streak bonus`,
      'streak',
      undefined,
      { currentStreak: result.currentStreak },
    );

    return {
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      xpAwarded: delta,
    };
  }

  /**
   * Check all achievement criteria for a user and unlock any newly earned ones.
   */
  async checkAchievements(userId: string): Promise<string[]> {
    // Load all achievements and user's already-unlocked set
    const [allAchievements, unlocked] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ]);

    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
    const newlyUnlocked: string[] = [];

    // Load user stats once for criteria checking
    const [totalXp, problemsSolved, matchesWon, streak] = await Promise.all([
      this.getTotalXp(userId),
      prisma.submission.count({
        where: { userId, status: 'ACCEPTED' },
      }),
      prisma.match.count({
        where: { winnerId: userId, status: 'COMPLETED' },
      }),
      prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    const stats: Record<string, number> = {
      totalXp,
      problemsSolved,
      matchesWon,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as Record<string, number>;
      const met = Object.entries(criteria).every(
        ([key, threshold]) => (stats[key] ?? 0) >= threshold,
      );

      if (met) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        newlyUnlocked.push(achievement.slug);
        logger.info(
          { userId, achievement: achievement.slug },
          'Achievement unlocked',
        );
      }
    }

    return newlyUnlocked;
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async getTotalXp(userId: string): Promise<number> {
    const result = await prisma.xpLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return result._sum.delta ?? 0;
  }
}

export const gamificationService = new GamificationService();
