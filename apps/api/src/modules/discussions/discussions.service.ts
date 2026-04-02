import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import type { CreateThreadInput, CreatePostInput, UpdatePostInput } from './discussions.schema.js';

export class DiscussionService {
  /**
   * List discussion threads for a problem, with post counts and author info.
   */
  async listThreads(
    problemSlug: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      select: { id: true },
    });

    if (!problem) {
      throw new NotFoundError('Problem not found');
    }

    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.discussionThread.findMany({
        where: { problemId: problem.id },
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
          _count: { select: { posts: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.discussionThread.count({ where: { problemId: problem.id } }),
    ]);

    return {
      data: threads.map((t) => ({
        id: t.id,
        problemId: t.problemId,
        userId: t.userId,
        title: t.title,
        postCount: t._count.posts,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        author: {
          displayName: t.user.profile?.displayName ?? 'Anonymous',
          avatarUrl: t.user.profile?.avatarUrl ?? null,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single thread with all its posts (flat, ordered by creation).
   */
  async getThread(threadId: string) {
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        posts: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    return {
      id: thread.id,
      problemId: thread.problemId,
      userId: thread.userId,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      author: {
        displayName: thread.user.profile?.displayName ?? 'Anonymous',
        avatarUrl: thread.user.profile?.avatarUrl ?? null,
      },
      posts: thread.posts.map((p) => ({
        id: p.id,
        threadId: p.threadId,
        userId: p.userId,
        body: p.body,
        parentPostId: p.parentPostId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        author: {
          displayName: p.user.profile?.displayName ?? 'Anonymous',
          avatarUrl: p.user.profile?.avatarUrl ?? null,
        },
      })),
    };
  }

  /**
   * Create a new discussion thread for a problem. Also creates the initial post.
   */
  async createThread(
    problemSlug: string,
    userId: string,
    input: CreateThreadInput,
  ) {
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      select: { id: true },
    });

    if (!problem) {
      throw new NotFoundError('Problem not found');
    }

    // Create thread + first post in a transaction
    const thread = await prisma.$transaction(async (tx) => {
      const t = await tx.discussionThread.create({
        data: {
          problemId: problem.id,
          userId,
          title: input.title,
        },
      });

      await tx.discussionPost.create({
        data: {
          threadId: t.id,
          userId,
          body: input.body,
        },
      });

      return t;
    });

    return { id: thread.id };
  }

  /**
   * Add a post (reply) to an existing thread.
   */
  async createPost(
    threadId: string,
    userId: string,
    input: CreatePostInput,
  ) {
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // If replying to a parent post, verify it exists in this thread
    if (input.parentPostId) {
      const parent = await prisma.discussionPost.findFirst({
        where: { id: input.parentPostId, threadId },
      });
      if (!parent) {
        throw new NotFoundError('Parent post not found in this thread');
      }
    }

    const post = await prisma.discussionPost.create({
      data: {
        threadId,
        userId,
        body: input.body,
        parentPostId: input.parentPostId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Touch thread updatedAt
    await prisma.discussionThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      id: post.id,
      threadId: post.threadId,
      userId: post.userId,
      body: post.body,
      parentPostId: post.parentPostId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        displayName: post.user.profile?.displayName ?? 'Anonymous',
        avatarUrl: post.user.profile?.avatarUrl ?? null,
      },
    };
  }

  /**
   * Update a post's body. Only the post author can do this.
   */
  async updatePost(postId: string, userId: string, input: UpdatePostInput) {
    const post = await prisma.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    const updated = await prisma.discussionPost.update({
      where: { id: postId },
      data: { body: input.body },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    return {
      id: updated.id,
      threadId: updated.threadId,
      userId: updated.userId,
      body: updated.body,
      parentPostId: updated.parentPostId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      author: {
        displayName: updated.user.profile?.displayName ?? 'Anonymous',
        avatarUrl: updated.user.profile?.avatarUrl ?? null,
      },
    };
  }

  /**
   * Delete a post. Only the author or an admin can do this.
   */
  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await prisma.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await prisma.discussionPost.delete({ where: { id: postId } });
  }
}

export const discussionService = new DiscussionService();
