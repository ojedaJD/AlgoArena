import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../lib/errors.js';

const ONLINE_KEY = (userId: string) => `ws:presence:user:${userId}`;

export class SocialService {
  /**
   * Send a friend request. Creates a PENDING friendship row.
   */
  async sendRequest(userId: string, friendUserId: string) {
    if (userId === friendUserId) {
      throw new ValidationError('Cannot send a friend request to yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: friendUserId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check for existing relationship in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendUserId },
          { userId: friendUserId, friendUserId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictError('Already friends');
      }
      if (existing.status === 'PENDING') {
        // If the OTHER person already sent us a request, auto-accept
        if (existing.userId === friendUserId) {
          return this.acceptRequest(existing.id, userId);
        }
        throw new ConflictError('Friend request already sent');
      }
      if (existing.status === 'BLOCKED') {
        throw new ForbiddenError('Unable to send friend request');
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendUserId,
        status: 'PENDING',
      },
    });

    // Notify the target user via Redis pub/sub
    await redis.publish(
      `user:${friendUserId}:notification`,
      JSON.stringify({
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'Someone sent you a friend request!',
        refType: 'friendship',
        refId: friendship.id,
      }),
    );

    return friendship;
  }

  /**
   * Accept a pending friend request. The userId must be the recipient (friendUserId in the row).
   */
  async acceptRequest(friendshipId: string, userId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundError('Friend request not found');
    }

    if (friendship.friendUserId !== userId) {
      throw new ForbiddenError('Only the recipient can accept a friend request');
    }

    if (friendship.status !== 'PENDING') {
      throw new ConflictError(`Cannot accept a ${friendship.status.toLowerCase()} request`);
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
    });

    return updated;
  }

  /**
   * Reject or cancel a pending friend request.
   * Either party (sender or receiver) can do this.
   */
  async rejectRequest(friendshipId: string, userId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundError('Friend request not found');
    }

    if (friendship.userId !== userId && friendship.friendUserId !== userId) {
      throw new ForbiddenError('Not your friend request');
    }

    if (friendship.status !== 'PENDING') {
      throw new ConflictError('Can only reject pending requests');
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
  }

  /**
   * Remove an existing friend (unfriend).
   */
  async removeFriend(userId: string, friendUserId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendUserId, status: 'ACCEPTED' },
          { userId: friendUserId, friendUserId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundError('Friendship not found');
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
  }

  /**
   * Block a user. Creates or updates a friendship row to BLOCKED.
   * The blocker is always the "userId" in the row.
   */
  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ValidationError('Cannot block yourself');
    }

    // Remove any existing friendship in either direction
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendUserId: targetUserId },
          { userId: targetUserId, friendUserId: userId },
        ],
      },
    });

    // Create a BLOCKED record
    return prisma.friendship.create({
      data: {
        userId,
        friendUserId: targetUserId,
        status: 'BLOCKED',
      },
    });
  }

  /**
   * List accepted friends with profile info and online status.
   */
  async listFriends(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendUserId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
            ratings: {
              where: { mode: 'RANKED' },
              select: { ratingValue: true },
              take: 1,
            },
          },
        },
        friend: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
            ratings: {
              where: { mode: 'RANKED' },
              select: { ratingValue: true },
              take: 1,
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Resolve the "other" user in each friendship
    const friends = await Promise.all(
      friendships.map(async (f) => {
        const other = f.userId === userId ? f.friend : f.user;
        const onlineKey = `ws:presence:user:${other.id}`;
        const online = (await redis.exists(onlineKey)) === 1;

        return {
          friendshipId: f.id,
          userId: other.id,
          displayName: other.profile?.displayName ?? 'Anonymous',
          avatarUrl: other.profile?.avatarUrl ?? null,
          status: f.status,
          rating: other.ratings[0]?.ratingValue ?? null,
          online,
        };
      }),
    );

    return friends;
  }

  /**
   * List pending friend requests (incoming).
   */
  async listPending(userId: string) {
    const pending = await prisma.friendship.findMany({
      where: { friendUserId: userId, status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pending.map((f) => ({
      id: f.id,
      fromUserId: f.userId,
      displayName: f.user.profile?.displayName ?? 'Anonymous',
      avatarUrl: f.user.profile?.avatarUrl ?? null,
      createdAt: f.createdAt.toISOString(),
    }));
  }
}

export const socialService = new SocialService();
