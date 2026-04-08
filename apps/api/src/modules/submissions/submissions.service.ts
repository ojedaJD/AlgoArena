import { SubmissionStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { NotFoundError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import type {
  SubmissionFilters,
  UpdateSubmissionStatusInput,
} from './submissions.schema.js';

// Redis stream names
const JUDGE_QUEUE_STREAM = 'judge:queue';
const JUDGE_RUN_STREAM = 'judge:run';

export class SubmissionService {
  // ─── Create & Enqueue ────────────────────────────────────────────────────────

  /**
   * Create a PENDING submission row and push it onto the judge stream.
   * Optionally links the submission to a match.
   */
  static async create(
    userId: string,
    problemSlug: string,
    code: string,
    language: string,
    matchId?: string,
  ) {
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug, isPublished: true },
      select: { id: true, timeLimitMs: true, memoryLimitMb: true },
    });
    if (!problem) throw new NotFoundError(`Problem '${problemSlug}' not found`);

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        matchId: matchId ?? null,
        code,
        language,
        status: 'PENDING',
      },
    });

    // Enqueue to judge worker via Redis Stream
    await redis.xadd(
      JUDGE_QUEUE_STREAM,
      '*',
      'submissionId', submission.id,
      'code', code,
      'language', language,
      'problemId', problem.id,
      'timeLimitMs', String(problem.timeLimitMs),
      'memoryLimitMb', String(problem.memoryLimitMb),
    );

    return submission;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────────

  /**
   * Get a single submission with all test results.
   * Only the owner may view the code; others only see the verdict summary.
   */
  static async getById(id: string, requestingUserId?: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        testResults: {
          orderBy: { testCase: { orderIndex: 'asc' } },
          select: {
            id: true,
            testCaseId: true,
            passed: true,
            actualOutput: true,
            runtimeMs: true,
            memoryKb: true,
            testCase: { select: { isPublic: true, orderIndex: true } },
          },
        },
        problem: { select: { id: true, slug: true, title: true } },
      },
    });

    if (!submission) throw new NotFoundError('Submission not found');

    const isOwner = requestingUserId === submission.userId;

    // Hide code from non-owners
    if (!isOwner) {
      return { ...submission, code: null };
    }

    return submission;
  }

  /**
   * Paginated submission history for a user.
   */
  static async listByUser(userId: string, filters: SubmissionFilters) {
    const { prismaArgs, wrap } = paginate({ cursor: filters.cursor, limit: filters.limit });

    const where: Prisma.SubmissionWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status as SubmissionStatus;
    }

    if (filters.problem) {
      const problem = await prisma.problem.findFirst({
        where: {
          OR: [{ slug: filters.problem }, { id: filters.problem }],
        },
        select: { id: true },
      });
      if (problem) where.problemId = problem.id;
    }

    const rows = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...prismaArgs,
      select: {
        id: true,
        language: true,
        status: true,
        runtimeMs: true,
        memoryKb: true,
        passedCases: true,
        totalCases: true,
        createdAt: true,
        problem: { select: { id: true, slug: true, title: true, difficulty: true } },
      },
    });

    return wrap(rows);
  }

  /**
   * All of a user's submissions for a specific problem, newest first.
   */
  static async listByProblem(problemSlug: string, userId: string) {
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      select: { id: true },
    });
    if (!problem) throw new NotFoundError(`Problem '${problemSlug}' not found`);

    return prisma.submission.findMany({
      where: { userId, problemId: problem.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        language: true,
        status: true,
        runtimeMs: true,
        memoryKb: true,
        passedCases: true,
        totalCases: true,
        createdAt: true,
      },
    });
  }

  // ─── Judge-Worker Callback ────────────────────────────────────────────────────

  /**
   * Called by the judge worker once judging is complete.
   * Writes the verdict and individual test results atomically.
   */
  static async updateStatus(id: string, update: UpdateSubmissionStatusInput) {
    const existing = await prisma.submission.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundError('Submission not found');

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id },
        data: {
          status: update.status as SubmissionStatus,
          runtimeMs: update.runtimeMs ?? null,
          memoryKb: update.memoryKb ?? null,
          passedCases: update.passedCases ?? 0,
          totalCases: update.totalCases ?? 0,
          errorOutput: update.errorOutput ?? null,
        },
      });

      if (update.results && update.results.length > 0) {
        await tx.submissionTestResult.createMany({
          data: update.results.map((r) => ({
            submissionId: id,
            testCaseId: r.testCaseId,
            passed: r.passed,
            actualOutput: r.actualOutput ?? null,
            runtimeMs: r.runtimeMs,
            memoryKb: r.memoryKb,
          })),
          skipDuplicates: true,
        });
      }
    });

    return prisma.submission.findUniqueOrThrow({ where: { id } });
  }

  // ─── Run (custom input) ───────────────────────────────────────────────────────

  /**
   * Enqueue a one-off "run" job (not stored as a submission).
   * Returns a job ID the client can use to poll for the result.
   */
  static async runCode(code: string, language: string, input: string): Promise<{ jobId: string }> {
    const jobId = randomUUID();

    await redis.xadd(
      JUDGE_RUN_STREAM,
      '*',
      'jobId', jobId,
      'code', code,
      'language', language,
      'input', input,
    );

    return { jobId };
  }
}
