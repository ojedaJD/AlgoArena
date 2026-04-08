import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

const DifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);

// ─── Problem Schemas ──────────────────────────────────────────────────────────

export const createProblemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(255),
  difficulty: DifficultyEnum,
  statementMd: z.string().min(1),
  timeLimitMs: z.number().int().min(100).max(30_000).default(2000),
  memoryLimitMb: z.number().int().min(16).max(1024).default(256),
  tags: z.array(z.string().min(1).max(60)).default([]),
  topicIds: z.array(z.string().uuid()).default([]),
});

export const updateProblemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  difficulty: DifficultyEnum.optional(),
  statementMd: z.string().min(1).optional(),
  timeLimitMs: z.number().int().min(100).max(30_000).optional(),
  memoryLimitMb: z.number().int().min(16).max(1024).optional(),
  tags: z.array(z.string().min(1).max(60)).optional(),
  topicIds: z.array(z.string().uuid()).optional(),
});

export const problemFiltersSchema = z.object({
  difficulty: DifficultyEnum.optional(),
  topic: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Test Case Schemas ────────────────────────────────────────────────────────

export const createTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(false),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateTestCaseSchema = z.object({
  input: z.string().optional(),
  expectedOutput: z.string().optional(),
  isPublic: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type ProblemFilters = z.infer<typeof problemFiltersSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
