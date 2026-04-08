import type { FastifyInstance } from 'fastify';
import { requireAuth, requireAdmin } from '../../plugins/auth.js';
import { CurriculumService } from './curriculum.service.js';
import {
  createTopicSchema,
  updateTopicSchema,
  createLessonSchema,
  updateLessonSchema,
} from './curriculum.schema.js';
import { ValidationError } from '../../lib/errors.js';

export async function curriculumRoutes(app: FastifyInstance) {
  // ─── GET /topics ───────────────────────────────────────────────────────
  // Public. Returns all root topics with nested children and counts.
  app.get('/topics', { preHandler: [] }, async (_request, reply) => {
    const topics = await CurriculumService.listTopics();
    return reply.code(200).send(topics);
  });

  // ─── GET /topics/:slug ─────────────────────────────────────────────────
  // Public. Topic detail with lesson list and linked published problems.
  app.get<{ Params: { slug: string } }>(
    '/topics/:slug',
    { preHandler: [] },
    async (request, reply) => {
      const topic = await CurriculumService.getTopicBySlug(request.params.slug);
      return reply.code(200).send(topic);
    },
  );

  // ─── POST /topics ──────────────────────────────────────────────────────
  // Admin only. Create a new topic.
  app.post('/topics', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const parseResult = createTopicSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
    }

    const topic = await CurriculumService.createTopic(parseResult.data);
    return reply.code(201).send(topic);
  });

  // ─── PATCH /topics/:id ─────────────────────────────────────────────────
  // Admin only. Update a topic's fields.
  app.patch<{ Params: { id: string } }>(
    '/topics/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateTopicSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const topic = await CurriculumService.updateTopic(request.params.id, parseResult.data);
      return reply.code(200).send(topic);
    },
  );

  // ─── DELETE /topics/:id ────────────────────────────────────────────────
  // Admin only. Delete a topic (cascades to lessons and problem links).
  app.delete<{ Params: { id: string } }>(
    '/topics/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await CurriculumService.deleteTopic(request.params.id);
      return reply.code(204).send();
    },
  );

  // ─── GET /lessons/:id ──────────────────────────────────────────────────
  // Public. Full lesson content (includes contentMd).
  app.get<{ Params: { id: string } }>(
    '/lessons/:id',
    { preHandler: [] },
    async (request, reply) => {
      const lesson = await CurriculumService.getLessonById(request.params.id);
      return reply.code(200).send(lesson);
    },
  );

  // ─── POST /topics/:topicId/lessons ────────────────────────────────────
  // Admin only. Add a lesson to a topic.
  app.post<{ Params: { topicId: string } }>(
    '/topics/:topicId/lessons',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = createLessonSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const lesson = await CurriculumService.createLesson(
        request.params.topicId,
        parseResult.data,
      );
      return reply.code(201).send(lesson);
    },
  );

  // ─── PATCH /lessons/:id ────────────────────────────────────────────────
  // Admin only. Update a lesson.
  app.patch<{ Params: { id: string } }>(
    '/lessons/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateLessonSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const lesson = await CurriculumService.updateLesson(request.params.id, parseResult.data);
      return reply.code(200).send(lesson);
    },
  );

  // ─── DELETE /lessons/:id ───────────────────────────────────────────────
  // Admin only. Delete a lesson.
  app.delete<{ Params: { id: string } }>(
    '/lessons/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await CurriculumService.deleteLesson(request.params.id);
      return reply.code(204).send();
    },
  );
}
