import { z } from 'zod';

// ─── Track Schemas ───────────────────────────────────────────────────────────

export const createTrackSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  orderIndex: z.number().int().min(0),
  isPublished: z.boolean().default(false),
});

export const updateTrackSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  orderIndex: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

// ─── Section Schemas ─────────────────────────────────────────────────────────

export const createSectionSchema = z.object({
  trackId: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0),
});

export const updateSectionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ─── Item Schemas ────────────────────────────────────────────────────────────

export const createItemSchema = z
  .object({
    sectionId: z.string().uuid(),
    orderIndex: z.number().int().min(0),
    kind: z.enum(['LESSON', 'TOPIC', 'PROBLEM']),
    lessonId: z.string().uuid().optional(),
    topicId: z.string().uuid().optional(),
    problemSlug: z.string().min(1).optional(),
  })
  .refine(
    (d) => {
      if (d.kind === 'LESSON') return !!d.lessonId;
      if (d.kind === 'TOPIC') return !!d.topicId;
      if (d.kind === 'PROBLEM') return !!d.problemSlug;
      return false;
    },
    { message: 'LESSON requires lessonId, TOPIC requires topicId, PROBLEM requires problemSlug' },
  );

export const updateItemSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  kind: z.enum(['LESSON', 'TOPIC', 'PROBLEM']).optional(),
  lessonId: z.string().uuid().nullable().optional(),
  topicId: z.string().uuid().nullable().optional(),
  problemSlug: z.string().min(1).nullable().optional(),
});

// ─── Progress Schema ─────────────────────────────────────────────────────────

export const updateProgressSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});

// ─── Param Schemas ───────────────────────────────────────────────────────────

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
