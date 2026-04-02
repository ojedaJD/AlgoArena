import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../plugins/auth.js';
import { ratingService } from './ratings.service.js';

const userIdParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function ratingRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/users/me/rating
   * Get the authenticated user's current rating.
   */
  fastify.get(
    '/users/me/rating',
    { preHandler: [requireAuth] },
    async (request) => {
      return ratingService.getUserRating(request.user.id);
    },
  );

  /**
   * GET /v1/users/:id/rating
   * Get a user's public rating.
   */
  fastify.get(
    '/users/:id/rating',
    { preHandler: [requireAuth] },
    async (request) => {
      const { id } = userIdParamsSchema.parse(request.params);
      return ratingService.getUserRating(id);
    },
  );

  /**
   * GET /v1/users/me/rating/history
   * Get the authenticated user's rating history for chart display.
   */
  fastify.get(
    '/users/me/rating/history',
    { preHandler: [requireAuth] },
    async (request) => {
      const { limit } = historyQuerySchema.parse(request.query);
      return ratingService.getRatingHistory(request.user.id, limit);
    },
  );
}
