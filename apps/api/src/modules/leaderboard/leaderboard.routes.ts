import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../plugins/auth.js';
import { leaderboardService } from './leaderboard.service.js';
import { prisma } from '../../config/prisma.js';

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function leaderboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/leaderboards/global
   * Get the top players on the global leaderboard.
   */
  fastify.get('/leaderboards/global', async (request) => {
    const { limit, offset } = leaderboardQuerySchema.parse(request.query);
    return leaderboardService.getGlobalTop(limit, offset);
  });

  /**
   * GET /v1/leaderboards/friends
   * Get a leaderboard scoped to the authenticated user's friends.
   */
  fastify.get(
    '/leaderboards/friends',
    { preHandler: [requireAuth] },
    async (request) => {
      const userId = request.user.id;

      // Get friend IDs
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendUserId: userId, status: 'ACCEPTED' },
          ],
        },
        select: { userId: true, friendUserId: true },
      });

      const friendIds = friendships.map((f) =>
        f.userId === userId ? f.friendUserId : f.userId,
      );

      return leaderboardService.getFriendsLeaderboard(userId, friendIds);
    },
  );
}
