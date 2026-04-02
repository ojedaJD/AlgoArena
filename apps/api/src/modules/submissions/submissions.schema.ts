import { z } from 'zod';

// ─── Supported Languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'cpp',
  'c',
  'java',
  'go',
  'rust',
] as const;

export const LanguageEnum = z.enum(SUPPORTED_LANGUAGES);

// ─── Submission Schemas ───────────────────────────────────────────────────────

export const createSubmissionSchema = z.object({
  code: z.string().min(1).max(65_536),
  language: LanguageEnum,
});

export const submissionFiltersSchema = z.object({
  problem: z.string().optional(), // slug or id
  status: z
    .enum([
      'PENDING',
      'RUNNING',
      'ACCEPTED',
      'WRONG_ANSWER',
      'TIME_LIMIT_EXCEEDED',
      'MEMORY_LIMIT_EXCEEDED',
      'RUNTIME_ERROR',
      'COMPILATION_ERROR',
    ])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Run-Code (custom input) Schema ───────────────────────────────────────────

export const runCodeSchema = z.object({
  code: z.string().min(1).max(65_536),
  language: LanguageEnum,
  /** Raw stdin to feed to the program (may be empty). */
  input: z.string().max(65_536).default(''),
});

// ─── Judge-Worker Update Schema (internal use) ────────────────────────────────

export const testResultSchema = z.object({
  testCaseId: z.string().uuid(),
  passed: z.boolean(),
  actualOutput: z.string().optional(),
  runtimeMs: z.number().int().min(0),
  memoryKb: z.number().int().min(0),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum([
    'RUNNING',
    'ACCEPTED',
    'WRONG_ANSWER',
    'TIME_LIMIT_EXCEEDED',
    'MEMORY_LIMIT_EXCEEDED',
    'RUNTIME_ERROR',
    'COMPILATION_ERROR',
  ]),
  runtimeMs: z.number().int().min(0).optional(),
  memoryKb: z.number().int().min(0).optional(),
  passedCases: z.number().int().min(0).optional(),
  totalCases: z.number().int().min(0).optional(),
  errorOutput: z.string().optional(),
  results: z.array(testResultSchema).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
export type TestResultInput = z.infer<typeof testResultSchema>;
