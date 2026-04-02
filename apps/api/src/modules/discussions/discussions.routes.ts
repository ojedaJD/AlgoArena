import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { discussionService } from './discussions.service.js';
import {
  problemSlugParamsSchema,
  threadIdParamsSchema,
  postIdParamsSchema,
  createThreadSchema,
  createPostSchema,
  updatePostSchema,
  discussionListQuerySchema,
} from './discussions.schema.js';

export async function discussionRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/problems/:slug/discussions
   * List discussion threads for a problem (public).
   */
  fastify.get('/problems/:slug/discussions', async (request) => {
    const { slug } = problemSlugParamsSchema.parse(request.params);
    const { page, limit } = discussionListQuerySchema.parse(request.query);
    return discussionService.listThreads(slug, page, limit);
  });

  /**
   * POST /v1/problems/:slug/discussions
   * Create a new discussion thread for a problem (auth required).
   */
  fastify.post(
    '/problems/:slug/discussions',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { slug } = problemSlugParamsSchema.parse(request.params);
      const input = createThreadSchema.parse(request.body);
      const result = await discussionService.createThread(
        slug,
        request.user.id,
        input,
      );
      return reply.status(201).send(result);
    },
  );

  /**
   * GET /v1/discussions/:threadId
   * Get a discussion thread with all its posts (public).
   */
  fastify.get('/discussions/:threadId', async (request) => {
    const { threadId } = threadIdParamsSchema.parse(request.params);
    return discussionService.getThread(threadId);
  });

  /**
   * POST /v1/discussions/:threadId/posts
   * Add a post (reply) to a thread (auth required).
   */
  fastify.post(
    '/discussions/:threadId/posts',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { threadId } = threadIdParamsSchema.parse(request.params);
      const input = createPostSchema.parse(request.body);
      const result = await discussionService.createPost(
        threadId,
        request.user.id,
        input,
      );
      return reply.status(201).send(result);
    },
  );

  /**
   * PATCH /v1/discussions/posts/:postId
   * Edit a post (auth required, owner only).
   */
  fastify.patch(
    '/discussions/posts/:postId',
    { preHandler: [requireAuth] },
    async (request) => {
      const { postId } = postIdParamsSchema.parse(request.params);
      const input = updatePostSchema.parse(request.body);
      return discussionService.updatePost(postId, request.user.id, input);
    },
  );

  /**
   * DELETE /v1/discussions/posts/:postId
   * Delete a post (auth required, owner or admin).
   */
  fastify.delete(
    '/discussions/posts/:postId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { postId } = postIdParamsSchema.parse(request.params);
      await discussionService.deletePost(
        postId,
        request.user.id,
        request.user.role,
      );
      return reply.status(204).send();
    },
  );
}
