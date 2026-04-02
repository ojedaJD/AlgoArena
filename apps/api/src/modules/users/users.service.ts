import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { UpdateProfileInput } from './users.schema.js';

export class UserService {
  /**
   * Create or update a user from Auth0 login data.
   * Called during authentication to keep user records in sync.
   */
  async upsertFromAuth0(sub: string, email: string | null) {
    return prisma.user.upsert({
      where: { auth0Sub: sub },
      update: { email },
      create: {
        auth0Sub: sub,
        email,
      },
      select: {
        id: true,
        auth0Sub: true,
        role: true,
      },
    });
  }

  /**
   * Get the full profile for the currently authenticated user.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Get a public user profile by ID (limited fields).
   */
  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Update the authenticated user's profile.
   * Creates the profile if it does not exist yet.
   */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      },
      create: {
        userId,
        displayName: data.displayName ?? 'Anonymous',
        avatarUrl: data.avatarUrl ?? null,
        bio: data.bio ?? null,
        timezone: data.timezone ?? 'UTC',
      },
      select: {
        displayName: true,
        avatarUrl: true,
        bio: true,
        timezone: true,
      },
    });

    return profile;
  }
}

export const userService = new UserService();
