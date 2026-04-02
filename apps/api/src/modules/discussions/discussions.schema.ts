import { z } from 'zod';
import { LIMITS } from '@dsa/shared';

// ── Params ───────────────────────────────────────────────────────────

export const problemSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export type ProblemSlugParams = z.infer<typeof problemSlugParamsSchema>;

export const threadIdParamsSchema = z.object({
  threadId: z.string().uuid('Invalid thread ID'),
});

export type ThreadIdParams = z.infer<typeof threadIdParamsSchema>;

export const postIdParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
});

export type PostIdParams = z.infer<typeof postIdParamsSchema>;

// ── Request Bodies ───────────────────────────────────────────────────

export const createThreadSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(LIMITS.DISCUSSION_TITLE_MAX, `Title must be at most ${LIMITS.DISCUSSION_TITLE_MAX} characters`),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(LIMITS.DISCUSSION_BODY_MAX, `Body must be at most ${LIMITS.DISCUSSION_BODY_MAX} characters`),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const createPostSchema = z.object({
  body: z
    .string()
    .min(1, 'Body is required')
    .max(LIMITS.DISCUSSION_BODY_MAX, `Body must be at most ${LIMITS.DISCUSSION_BODY_MAX} characters`),
  parentPostId: z.string().uuid().optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  body: z
    .string()
    .min(1, 'Body is required')
    .max(LIMITS.DISCUSSION_BODY_MAX, `Body must be at most ${LIMITS.DISCUSSION_BODY_MAX} characters`),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ── Query ────────────────────────────────────────────────────────────

export const discussionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DiscussionListQuery = z.infer<typeof discussionListQuerySchema>;
