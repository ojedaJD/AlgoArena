import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { matchService } from './matches.service.js';
import {
  joinQueueSchema,
  createChallengeSchema,
  matchIdParamsSchema,
  matchHistoryQuerySchema,
} from './matches.schema.js';

export async function matchRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/matches/queue
   * Join the ranked/casual matchmaking queue.
   */
  fastify.post(
    '/matches/queue',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { mode } = joinQueueSchema.parse(request.body);
      const result = await matchService.joinQueue(request.user.id, mode);

      if (result) {
        return reply.status(200).send({ status: 'matched', matchId: result.matchId });
      }

      return reply.status(202).send({ status: 'queued' });
    },
  );

  /**
   * DELETE /v1/matches/queue
   * Leave the matchmaking queue.
   */
  fastify.delete(
    '/matches/queue',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      await matchService.leaveQueue(request.user.id);
      return reply.status(204).send();
    },
  );

  /**
   * POST /v1/matches/challenges
   * Challenge a friend to a match.
   */
  fastify.post(
    '/matches/challenges',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { friendUserId } = createChallengeSchema.parse(request.body);
      const match = await matchService.createChallenge(request.user.id, friendUserId);
      return reply.status(201).send(match);
    },
  );

  /**
   * POST /v1/matches/:id/accept
   * Accept a friend challenge.
   */
  fastify.post(
    '/matches/:id/accept',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = matchIdParamsSchema.parse(request.params);
      await matchService.acceptChallenge(id, request.user.id);
      return reply.status(200).send({ status: 'accepted' });
    },
  );

  /**
   * GET /v1/matches/:id
   * Get match details.
   */
  fastify.get(
    '/matches/:id',
    { preHandler: [requireAuth] },
    async (request) => {
      const { id } = matchIdParamsSchema.parse(request.params);
      return matchService.getMatch(id);
    },
  );

  /**
   * GET /v1/users/me/matches
   * Get authenticated user's match history.
   */
  fastify.get(
    '/users/me/matches',
    { preHandler: [requireAuth] },
    async (request) => {
      const { page, limit } = matchHistoryQuerySchema.parse(request.query);
      return matchService.getUserMatches(request.user.id, page, limit);
    },
  );
}
