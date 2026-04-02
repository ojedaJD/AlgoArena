import { z } from 'zod';

// ─── Topic Schemas ────────────────────────────────────────────────────────────

export const createTopicSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().min(0),
  parentTopicId: z.string().uuid().nullable().optional(),
});

export const updateTopicSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  title: z.string().min(1).max(255).optional(),
  orderIndex: z.number().int().min(0).optional(),
  parentTopicId: z.string().uuid().nullable().optional(),
});

// ─── Lesson Schemas ───────────────────────────────────────────────────────────

export const createLessonSchema = z.object({
  title: z.string().min(1).max(255),
  contentMd: z.string().min(1),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  contentMd: z.string().min(1).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
