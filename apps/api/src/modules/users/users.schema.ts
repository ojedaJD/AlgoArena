import { z } from 'zod';

// ─── Request Schemas ────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be at most 30 characters')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().nullable(),
  timezone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const getUserByIdParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;

// ─── Response Schemas ───────────────────────────────────────────────

export const userProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  status: z.enum(['ACTIVE', 'BANNED']),
  createdAt: z.string(),
  profile: z
    .object({
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
      bio: z.string().nullable(),
      timezone: z.string(),
    })
    .nullable(),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

export const publicUserResponseSchema = z.object({
  id: z.string().uuid(),
  profile: z
    .object({
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
      bio: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
});

export type PublicUserResponse = z.infer<typeof publicUserResponseSchema>;
