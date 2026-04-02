import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { gamificationService } from './gamification.service.js';
import { prisma } from '../../config/prisma.js';

export async function gamificationRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/users/me/progress
   * Get the authenticated user's full progress (XP, level, streak, stats, achievements).
   */
  fastify.get(
    '/users/me/progress',
    { preHandler: [requireAuth] },
    async (request) => {
      // Also check/update streak on every progress fetch
      await gamificationService.checkAndUpdateStreak(request.user.id);
      // Check for newly earned achievements
      await gamificationService.checkAchievements(request.user.id);

      return gamificationService.getProgress(request.user.id);
    },
  );

  /**
   * GET /v1/achievements
   * Get all achievements with the authenticated user's unlock status.
   */
  fastify.get(
    '/achievements',
    { preHandler: [requireAuth] },
    async (request) => {
      const [achievements, userAchievements] = await Promise.all([
        prisma.achievement.findMany({ orderBy: { title: 'asc' } }),
        prisma.userAchievement.findMany({
          where: { userId: request.user.id },
          select: { achievementId: true, unlockedAt: true },
        }),
      ]);

      const unlockedMap = new Map(
        userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
      );

      return achievements.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        description: a.description,
        iconUrl: a.iconUrl,
        criteria: a.criteria,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
      }));
    },
  );
}
