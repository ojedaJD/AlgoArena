import { z } from 'zod';
import { LIMITS, SUPPORTED_LANGUAGES } from '../constants/limits';

export const displayNameSchema = z
  .string()
  .min(LIMITS.DISPLAY_NAME_MIN)
  .max(LIMITS.DISPLAY_NAME_MAX)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens');

export const bioSchema = z.string().max(LIMITS.BIO_MAX).optional();

export const codeSubmissionSchema = z.object({
  code: z.string().min(1).max(LIMITS.CODE_MAX_SIZE_BYTES),
  language: z.enum(SUPPORTED_LANGUAGES),
});

export const problemFilterSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  topic: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema,
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().max(50).optional(),
});

export const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  statementMd: z.string().min(1),
  timeLimitMs: z.number().min(100).max(30000).default(2000),
  memoryLimitMb: z.number().min(16).max(512).default(256),
  tags: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
});

export const createTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(false),
  orderIndex: z.number().int().min(0).default(0),
});

export const createThreadSchema = z.object({
  title: z.string().min(1).max(LIMITS.DISCUSSION_TITLE_MAX),
  body: z.string().min(1).max(LIMITS.DISCUSSION_BODY_MAX),
});

export const createPostSchema = z.object({
  body: z.string().min(1).max(LIMITS.DISCUSSION_BODY_MAX),
  parentPostId: z.string().uuid().optional(),
});
