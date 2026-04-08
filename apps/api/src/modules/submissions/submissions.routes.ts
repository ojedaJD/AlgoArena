import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../plugins/auth.js';
import { SubmissionService } from './submissions.service.js';
import {
  createSubmissionSchema,
  submissionFiltersSchema,
  runCodeSchema,
} from './submissions.schema.js';
import { ValidationError } from '../../lib/errors.js';

export async function submissionRoutes(app: FastifyInstance) {
  // ─── POST /v1/problems/:slug/submissions ─────────────────────────────────
  // Authenticated. Submit code against a problem's full test suite.
  app.post<{ Params: { slug: string } }>(
    '/v1/problems/:slug/submissions',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = createSubmissionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const { code, language } = parseResult.data;
      const submission = await SubmissionService.create(
        request.user.id,
        request.params.slug,
        code,
        language,
      );

      return reply.code(202).send(submission);
    },
  );

  // ─── POST /v1/problems/:slug/run ─────────────────────────────────────────
  // Authenticated. Run code against custom stdin — does not store a submission.
  app.post<{ Params: { slug: string } }>(
    '/v1/problems/:slug/run',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = runCodeSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid request body');
      }

      const { code, language, input } = parseResult.data;
      const result = await SubmissionService.runCode(code, language, input);

      return reply.code(202).send(result);
    },
  );

  // ─── GET /v1/submissions/:id ──────────────────────────────────────────────
  // Public. Returns verdict summary. Code is hidden from non-owners.
  app.get<{ Params: { id: string } }>(
    '/v1/submissions/:id',
    { preHandler: [] },
    async (request, reply) => {
      const requestingUserId: string | undefined = (request as any).user?.id;
      const submission = await SubmissionService.getById(request.params.id, requestingUserId);
      return reply.code(200).send(submission);
    },
  );

  // ─── GET /v1/users/me/submissions ────────────────────────────────────────
  // Authenticated. Paginated submission history for the calling user.
  app.get(
    '/v1/users/me/submissions',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const parseResult = submissionFiltersSchema.safeParse(request.query);
      if (!parseResult.success) {
        throw new ValidationError(parseResult.error.errors[0]?.message ?? 'Invalid query params');
      }

      const result = await SubmissionService.listByUser(request.user.id, parseResult.data);
      return reply.code(200).send(result);
    },
  );
}
