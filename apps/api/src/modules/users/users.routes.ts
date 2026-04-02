import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { userService } from './users.service.js';
import { updateProfileSchema, getUserByIdParamsSchema } from './users.schema.js';

export async function userRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/users/me
   * Returns the authenticated user's full profile.
   */
  fastify.get(
    '/users/me',
    { preHandler: [requireAuth] },
    async (request) => {
      return userService.getMe(request.user.id);
    },
  );

  /**
   * PATCH /v1/users/me
   * Updates the authenticated user's profile.
   */
  fastify.patch(
    '/users/me',
    { preHandler: [requireAuth] },
    async (request) => {
      const data = updateProfileSchema.parse(request.body);
      return userService.updateProfile(request.user.id, data);
    },
  );

  /**
   * GET /v1/users/:id
   * Returns a public user profile by ID.
   */
  fastify.get(
    '/users/:id',
    { preHandler: [requireAuth] },
    async (request) => {
      const { id } = getUserByIdParamsSchema.parse(request.params);
      return userService.getById(id);
    },
  );
}
