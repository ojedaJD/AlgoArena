import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { socialService } from './social.service.js';
import {
  sendFriendRequestSchema,
  friendRequestIdParamsSchema,
  friendUserIdParamsSchema,
  friendsQuerySchema,
} from './social.schema.js';

export async function socialRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/friends/requests
   * Send a friend request.
   */
  fastify.post(
    '/friends/requests',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { friendUserId } = sendFriendRequestSchema.parse(request.body);
      const result = await socialService.sendRequest(request.user.id, friendUserId);
      return reply.status(201).send(result);
    },
  );

  /**
   * POST /v1/friends/requests/:id/accept
   * Accept a pending friend request.
   */
  fastify.post(
    '/friends/requests/:id/accept',
    { preHandler: [requireAuth] },
    async (request) => {
      const { id } = friendRequestIdParamsSchema.parse(request.params);
      return socialService.acceptRequest(id, request.user.id);
    },
  );

  /**
   * DELETE /v1/friends/requests/:id
   * Reject or cancel a pending friend request.
   */
  fastify.delete(
    '/friends/requests/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = friendRequestIdParamsSchema.parse(request.params);
      await socialService.rejectRequest(id, request.user.id);
      return reply.status(204).send();
    },
  );

  /**
   * DELETE /v1/friends/:userId
   * Remove a friend.
   */
  fastify.delete(
    '/friends/:userId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { userId } = friendUserIdParamsSchema.parse(request.params);
      await socialService.removeFriend(request.user.id, userId);
      return reply.status(204).send();
    },
  );

  /**
   * GET /v1/friends
   * List accepted friends.
   */
  fastify.get(
    '/friends',
    { preHandler: [requireAuth] },
    async (request) => {
      const { page, limit } = friendsQuerySchema.parse(request.query);
      return socialService.listFriends(request.user.id, page, limit);
    },
  );

  /**
   * GET /v1/friends/pending
   * List pending incoming friend requests.
   */
  fastify.get(
    '/friends/pending',
    { preHandler: [requireAuth] },
    async (request) => {
      return socialService.listPending(request.user.id);
    },
  );
}
