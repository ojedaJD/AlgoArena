import type { FastifyInstance } from 'fastify';
import { requireAuth, requireAdmin } from '../../plugins/auth.js';
import { CurriculumTracksService } from './curriculum-tracks.service.js';
import {
  createTrackSchema,
  updateTrackSchema,
  createSectionSchema,
  updateSectionSchema,
  createItemSchema,
  updateItemSchema,
  updateProgressSchema,
} from './curriculum-tracks.schema.js';
import { ValidationError } from '../../lib/errors.js';

export async function curriculumTracksRoutes(app: FastifyInstance) {
  // ─── GET /v1/curriculum/tracks ───────────────────────────────────────────────
  // Public. List all published tracks.
  app.get('/curriculum/tracks', { preHandler: [] }, async (_request, reply) => {
    const tracks = await CurriculumTracksService.listTracks();
    return reply.code(200).send(tracks);
  });

  // ─── GET /v1/curriculum/tracks/:slug ─────────────────────────────────────────
  // Public. Track detail with sections and items.
  app.get<{ Params: { slug: string } }>(
    '/curriculum/tracks/:slug',
    { preHandler: [] },
    async (request, reply) => {
      const track = await CurriculumTracksService.getTrackBySlug(request.params.slug);
      return reply.code(200).send(track);
    },
  );

  // ─── POST /v1/curriculum/tracks ──────────────────────────────────────────────
  // Admin only. Create a new track.
  app.post(
    '/curriculum/tracks',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = createTrackSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const track = await CurriculumTracksService.createTrack(parseResult.data);
      return reply.code(201).send(track);
    },
  );

  // ─── PATCH /v1/curriculum/tracks/:id ─────────────────────────────────────────
  // Admin only. Update a track.
  app.patch<{ Params: { id: string } }>(
    '/curriculum/tracks/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateTrackSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const track = await CurriculumTracksService.updateTrack(request.params.id, parseResult.data);
      return reply.code(200).send(track);
    },
  );

  // ─── DELETE /v1/curriculum/tracks/:id ────────────────────────────────────────
  // Admin only. Delete a track (cascades to sections and items).
  app.delete<{ Params: { id: string } }>(
    '/curriculum/tracks/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await CurriculumTracksService.deleteTrack(request.params.id);
      return reply.code(204).send();
    },
  );

  // ─── POST /v1/curriculum/sections ────────────────────────────────────────────
  // Admin only. Create a new section.
  app.post(
    '/curriculum/sections',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = createSectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const section = await CurriculumTracksService.createSection(parseResult.data);
      return reply.code(201).send(section);
    },
  );

  // ─── PATCH /v1/curriculum/sections/:id ───────────────────────────────────────
  // Admin only. Update a section.
  app.patch<{ Params: { id: string } }>(
    '/curriculum/sections/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateSectionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const section = await CurriculumTracksService.updateSection(request.params.id, parseResult.data);
      return reply.code(200).send(section);
    },
  );

  // ─── DELETE /v1/curriculum/sections/:id ──────────────────────────────────────
  // Admin only. Delete a section (cascades to items).
  app.delete<{ Params: { id: string } }>(
    '/curriculum/sections/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await CurriculumTracksService.deleteSection(request.params.id);
      return reply.code(204).send();
    },
  );

  // ─── POST /v1/curriculum/items ───────────────────────────────────────────────
  // Admin only. Create a new item.
  app.post(
    '/curriculum/items',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = createItemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const item = await CurriculumTracksService.createItem(parseResult.data);
      return reply.code(201).send(item);
    },
  );

  // ─── PATCH /v1/curriculum/items/:id ──────────────────────────────────────────
  // Admin only. Update an item.
  app.patch<{ Params: { id: string } }>(
    '/curriculum/items/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateItemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const item = await CurriculumTracksService.updateItem(request.params.id, parseResult.data);
      return reply.code(200).send(item);
    },
  );

  // ─── DELETE /v1/curriculum/items/:id ─────────────────────────────────────────
  // Admin only. Delete an item.
  app.delete<{ Params: { id: string } }>(
    '/curriculum/items/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await CurriculumTracksService.deleteItem(request.params.id);
      return reply.code(204).send();
    },
  );

  // ─── GET /v1/users/me/curriculum/progress ────────────────────────────────────
  // Authenticated. Get current user's lesson progress.
  app.get(
    '/users/me/curriculum/progress',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const progress = await CurriculumTracksService.getUserProgress(request.user.id);
      return reply.code(200).send(progress);
    },
  );

  // ─── POST /v1/lessons/:id/progress ──────────────────────────────────────────
  // Authenticated. Update lesson progress for current user.
  app.post<{ Params: { id: string } }>(
    '/lessons/:id/progress',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = updateProgressSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const progress = await CurriculumTracksService.updateLessonProgress(
        request.user.id,
        request.params.id,
        parseResult.data,
      );
      return reply.code(200).send(progress);
    },
  );
}
