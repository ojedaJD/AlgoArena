import type { FastifyInstance } from 'fastify';
import { requireAuth, requireAdmin } from '../../plugins/auth.js';
import { ProblemService } from './problems.service.js';
import {
  createProblemSchema,
  updateProblemSchema,
  problemFiltersSchema,
  createTestCaseSchema,
  updateTestCaseSchema,
} from './problems.schema.js';
import { ValidationError } from '../../lib/errors.js';

export async function problemRoutes(app: FastifyInstance) {
  // ─── GET /problems ──────────────────────────────────────────────────────
  // Public. Lists published problems with optional filters.
  app.get('/problems', { preHandler: [] }, async (request, reply) => {
    const parseResult = problemFiltersSchema.safeParse(request.query);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid query params');
    }

    const userId: string | undefined = (request as any).user?.id;
    const result = await ProblemService.list(parseResult.data, userId);
    return reply.code(200).send(result);
  });

  // ─── GET /problems/:slug ────────────────────────────────────────────────
  // Public. Returns full problem with public test cases.
  app.get<{ Params: { slug: string } }>(
    '/problems/:slug',
    { preHandler: [] },
    async (request, reply) => {
      const userId: string | undefined = (request as any).user?.id;
      const problem = await ProblemService.getBySlug(request.params.slug, userId);
      return reply.code(200).send(problem);
    },
  );

  // ─── GET /problems/:slug/tests/public ──────────────────────────────────
  // Public. Returns only public test cases for a problem (by slug).
  app.get<{ Params: { slug: string } }>(
    '/problems/:slug/tests/public',
    { preHandler: [] },
    async (request, reply) => {
      // Resolve slug → id
      const problem = await ProblemService.getBySlug(request.params.slug);
      const tests = await ProblemService.getTestCases(problem.id, false);
      return reply.code(200).send(tests);
    },
  );

  // ─── POST /problems ────────────────────────────────────────────────────
  // Admin only. Create a new problem.
  app.post('/problems', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const parseResult = createProblemSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
    }

    const problem = await ProblemService.create(parseResult.data);
    return reply.code(201).send(problem);
  });

  // ─── PATCH /problems/:id ───────────────────────────────────────────────
  // Admin only. Update scalar fields, tags, or topic links.
  app.patch<{ Params: { id: string } }>(
    '/problems/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateProblemSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const problem = await ProblemService.update(request.params.id, parseResult.data);
      return reply.code(200).send(problem);
    },
  );

  // ─── POST /problems/:id/publish ───────────────────────────────────────
  // Admin only. Set isPublished = true.
  app.post<{ Params: { id: string } }>(
    '/problems/:id/publish',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const problem = await ProblemService.publish(request.params.id);
      return reply.code(200).send(problem);
    },
  );

  // ─── DELETE /problems/:id ──────────────────────────────────────────────
  // Admin only. Hard delete.
  app.delete<{ Params: { id: string } }>(
    '/problems/:id',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await ProblemService.delete(request.params.id);
      return reply.code(204).send();
    },
  );

  // ─── POST /problems/:id/tests ─────────────────────────────────────────
  // Admin only. Add a test case to a problem.
  app.post<{ Params: { id: string } }>(
    '/problems/:id/tests',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = createTestCaseSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const testCase = await ProblemService.createTestCase(request.params.id, parseResult.data);
      return reply.code(201).send(testCase);
    },
  );

  // ─── PATCH /problems/tests/:testId ────────────────────────────────────
  // Admin only. Update a test case.
  app.patch<{ Params: { testId: string } }>(
    '/problems/tests/:testId',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const parseResult = updateTestCaseSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const testCase = await ProblemService.updateTestCase(request.params.testId, parseResult.data);
      return reply.code(200).send(testCase);
    },
  );

  // ─── DELETE /problems/tests/:testId ───────────────────────────────────
  // Admin only. Delete a test case.
  app.delete<{ Params: { testId: string } }>(
    '/problems/tests/:testId',
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      await ProblemService.deleteTestCase(request.params.testId);
      return reply.code(204).send();
    },
  );
}
