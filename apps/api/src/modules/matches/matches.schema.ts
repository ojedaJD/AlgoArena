import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────────────

export const joinQueueSchema = z.object({
  mode: z.enum(['RANKED', 'CASUAL']),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;

export const createChallengeSchema = z.object({
  friendUserId: z.string().uuid('Invalid user ID'),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const matchIdParamsSchema = z.object({
  id: z.string().uuid('Invalid match ID'),
});

export type MatchIdParams = z.infer<typeof matchIdParamsSchema>;

export const matchHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type MatchHistoryQuery = z.infer<typeof matchHistoryQuerySchema>;
