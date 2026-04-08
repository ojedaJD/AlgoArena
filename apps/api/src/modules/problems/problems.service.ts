import { Difficulty, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type {
  CreateProblemInput,
  UpdateProblemInput,
  ProblemFilters,
  CreateTestCaseInput,
  UpdateTestCaseInput,
} from './problems.schema.js';

export class ProblemService {
  // ─── Public Queries ──────────────────────────────────────────────────────────

  /**
   * Return a cursor-paginated list of published problems.
   * Optionally marks each problem as solved when a userId is supplied.
   */
  static async list(filters: ProblemFilters, userId?: string) {
    const { prismaArgs, wrap } = paginate({ cursor: filters.cursor, limit: filters.limit });

    const where: Prisma.ProblemWhereInput = {
      isPublished: true,
    };

    if (filters.difficulty) {
      where.difficulty = filters.difficulty as Difficulty;
    }

    if (filters.tag) {
      where.tags = { some: { tag: filters.tag } };
    }

    if (filters.topic) {
      where.topics = {
        some: {
          topic: {
            OR: [{ slug: filters.topic }, { id: filters.topic }],
          },
        },
      };
    }

    if (filters.search) {
      const term = `%${filters.search}%`;
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
      void term; // keep linter happy – using Prisma's built-in search
    }

    const rows = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...prismaArgs,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        isPublished: true,
        createdAt: true,
        tags: { select: { tag: true } },
        topics: { select: { topic: { select: { id: true, slug: true, title: true } } } },
        _count: { select: { submissions: true } },
      },
    });

    const result = wrap(rows);

    // Annotate solved status when caller is authenticated
    if (userId) {
      const problemIds = result.data.map((p) => p.id);
      const solved = await prisma.submission.findMany({
        where: {
          userId,
          problemId: { in: problemIds },
          status: 'ACCEPTED',
        },
        select: { problemId: true },
        distinct: ['problemId'],
      });
      const solvedSet = new Set(solved.map((s) => s.problemId));

      return {
        ...result,
        data: result.data.map((p) => ({ ...p, solved: solvedSet.has(p.id) })),
      };
    }

    return { ...result, data: result.data.map((p) => ({ ...p, solved: false })) };
  }

  /**
   * Fetch full problem by slug including public test cases and tags.
   */
  static async getBySlug(slug: string, userId?: string) {
    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        tags: { select: { tag: true } },
        topics: { select: { topic: { select: { id: true, slug: true, title: true } } } },
        testCases: {
          where: { isPublic: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!problem || !problem.isPublished) {
      throw new NotFoundError(`Problem '${slug}' not found`);
    }

    let solved = false;
    if (userId) {
      const accepted = await prisma.submission.findFirst({
        where: { userId, problemId: problem.id, status: 'ACCEPTED' },
        select: { id: true },
      });
      solved = !!accepted;
    }

    return { ...problem, solved };
  }

  // ─── Admin Mutations ─────────────────────────────────────────────────────────

  static async create(data: CreateProblemInput) {
    const existing = await prisma.problem.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`A problem with slug '${data.slug}' already exists`);
    }

    return prisma.problem.create({
      data: {
        slug: data.slug,
        title: data.title,
        difficulty: data.difficulty as Difficulty,
        statementMd: data.statementMd,
        timeLimitMs: data.timeLimitMs,
        memoryLimitMb: data.memoryLimitMb,
        tags: {
          create: data.tags.map((tag) => ({ tag })),
        },
        topics: {
          create: data.topicIds.map((topicId) => ({ topicId })),
        },
      },
      include: {
        tags: { select: { tag: true } },
        topics: { select: { topic: { select: { id: true, slug: true, title: true } } } },
      },
    });
  }

  static async update(id: string, data: UpdateProblemInput) {
    await ProblemService._requireExists(id);

    return prisma.$transaction(async (tx) => {
      // Replace tags if provided
      if (data.tags !== undefined) {
        await tx.problemTag.deleteMany({ where: { problemId: id } });
        await tx.problemTag.createMany({
          data: data.tags.map((tag) => ({ problemId: id, tag })),
        });
      }

      // Replace topic links if provided
      if (data.topicIds !== undefined) {
        await tx.problemTopic.deleteMany({ where: { problemId: id } });
        await tx.problemTopic.createMany({
          data: data.topicIds.map((topicId) => ({ problemId: id, topicId })),
          skipDuplicates: true,
        });
      }

      const { tags: _t, topicIds: _ti, ...scalarUpdates } = data;

      return tx.problem.update({
        where: { id },
        data: scalarUpdates as Omit<typeof data, 'tags' | 'topicIds'>,
        include: {
          tags: { select: { tag: true } },
          topics: { select: { topic: { select: { id: true, slug: true, title: true } } } },
        },
      });
    });
  }

  static async publish(id: string) {
    await ProblemService._requireExists(id);

    // Ensure at least one test case exists before publishing
    const testCount = await prisma.testCase.count({ where: { problemId: id } });
    if (testCount === 0) {
      throw new ValidationError('Cannot publish a problem with no test cases');
    }

    return prisma.problem.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  static async delete(id: string) {
    await ProblemService._requireExists(id);
    await prisma.problem.delete({ where: { id } });
  }

  // ─── Test Cases ───────────────────────────────────────────────────────────────

  static async getTestCases(problemId: string, includeHidden = false) {
    await ProblemService._requireExists(problemId);

    const where: Prisma.TestCaseWhereInput = {
      problemId,
      ...(includeHidden ? {} : { isPublic: true }),
    };

    return prisma.testCase.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }

  static async createTestCase(problemId: string, data: CreateTestCaseInput) {
    await ProblemService._requireExists(problemId);

    return prisma.testCase.create({
      data: {
        problemId,
        input: data.input,
        expectedOutput: data.expectedOutput,
        isPublic: data.isPublic,
        orderIndex: data.orderIndex,
      },
    });
  }

  static async updateTestCase(id: string, data: UpdateTestCaseInput) {
    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Test case not found');

    return prisma.testCase.update({ where: { id }, data });
  }

  static async deleteTestCase(id: string) {
    const existing = await prisma.testCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Test case not found');

    await prisma.testCase.delete({ where: { id } });
  }

  // ─── Match Support ────────────────────────────────────────────────────────────

  /**
   * Pick a random published problem for a match.
   * Optionally filtered by difficulty.
   */
  static async getRandomForMatch(difficulty?: 'EASY' | 'MEDIUM' | 'HARD') {
    const where: Prisma.ProblemWhereInput = {
      isPublished: true,
      ...(difficulty ? { difficulty: difficulty as Difficulty } : {}),
    };

    const count = await prisma.problem.count({ where });
    if (count === 0) throw new NotFoundError('No published problems available');

    const skip = Math.floor(Math.random() * count);

    const results = await prisma.problem.findMany({
      where,
      skip,
      take: 1,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        timeLimitMs: true,
        memoryLimitMb: true,
      },
    });

    if (!results[0]) throw new NotFoundError('No published problems available');
    return results[0];
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private static async _requireExists(id: string) {
    const p = await prisma.problem.findUnique({ where: { id }, select: { id: true } });
    if (!p) throw new NotFoundError('Problem not found');
    return p;
  }
}
