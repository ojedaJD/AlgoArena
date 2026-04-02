import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  friendUserId: z.string().uuid('Invalid user ID'),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

export const friendRequestIdParamsSchema = z.object({
  id: z.string().uuid('Invalid friendship ID'),
});

export type FriendRequestIdParams = z.infer<typeof friendRequestIdParamsSchema>;

export const friendUserIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type FriendUserIdParams = z.infer<typeof friendUserIdParamsSchema>;

export const friendsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type FriendsQuery = z.infer<typeof friendsQuerySchema>;
