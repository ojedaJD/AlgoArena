/**
 * Judge Worker - runs as a SEPARATE PROCESS outside of Fastify.
 *
 * Consumes submission and custom-run jobs from Redis Streams,
 * executes code in sandboxed Docker containers, and writes
 * results back to the database.
 *
 * Usage: npx tsx src/judge/worker.ts
 */

import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';
import { getLanguage } from './languages/index.js';
import { executeCode } from './executor.js';
import { compareOutput } from './comparator.js';
import {
  ensureGroup,
  consumeSubmission,
  consumeRun,
  ackSubmission,
  ackRun,
  publishResult,
  type SubmissionJob,
  type RunJob,
  type JudgeResult,
  type RunResult,
} from './queue.js';

// ── Configuration ────────────────────────────────────────────────────────────

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const DEFAULT_MEMORY_LIMIT_MB = 256;

let running = true;

// ── Submission Processing ────────────────────────────────────────────────────

async function processSubmission(job: SubmissionJob): Promise<void> {
  const { submissionId, code, language, problemId, timeLimitMs, memoryLimitMb } = job;
  const log = logger.child({ submissionId, language, problemId, workerId: WORKER_ID });

  log.info('Processing submission');

  try {
    // Mark as RUNNING
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'RUNNING' },
    });

    // Resolve language config
    const langConfig = getLanguage(language);

    // Fetch all test cases for this problem, ordered
    const testCases = await prisma.testCase.findMany({
      where: { problemId },
      orderBy: { orderIndex: 'asc' },
    });

    if (testCases.length === 0) {
      log.warn('No test cases found for problem');
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'RUNTIME_ERROR',
          errorOutput: 'No test cases configured for this problem.',
          totalCases: 0,
          passedCases: 0,
        },
      });
      return;
    }

    let passedCases = 0;
    let maxRuntimeMs = 0;
    let maxMemoryKb = 0;
    let finalStatus: string = 'ACCEPTED';
    let errorOutput: string | null = null;
    const testResults: Array<{
      testCaseId: string;
      passed: boolean;
      actualOutput: string | null;
      runtimeMs: number;
      memoryKb: number;
    }> = [];

    // Execute against each test case sequentially
    for (const testCase of testCases) {
      const result = await executeCode(
        code,
        langConfig,
        testCase.input,
        timeLimitMs,
        memoryLimitMb,
      );

      const runtimeMs = result.runtimeMs;
      const memoryKb = result.memoryKb;
      maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      // Determine verdict for this test case
      let passed = false;

      if (result.timedOut) {
        if (finalStatus === 'ACCEPTED') {
          finalStatus = 'TIME_LIMIT_EXCEEDED';
          errorOutput = `Time limit exceeded on test case ${testResults.length + 1}`;
        }
      } else if (result.oomKilled) {
        if (finalStatus === 'ACCEPTED') {
          finalStatus = 'MEMORY_LIMIT_EXCEEDED';
          errorOutput = `Memory limit exceeded on test case ${testResults.length + 1}`;
        }
      } else if (result.exitCode !== 0 && !result.stderr.includes('Compilation')) {
        // Check if this is a compilation error (exitCode != 0 from compile step)
        // The executor returns exitCode != 0 and runtimeMs = 0 for compile failures
        if (result.runtimeMs === 0 && result.exitCode !== 0 && language !== 'python' && language !== 'javascript') {
          if (finalStatus === 'ACCEPTED') {
            finalStatus = 'COMPILATION_ERROR';
            errorOutput = result.stderr;
          }
        } else {
          if (finalStatus === 'ACCEPTED') {
            finalStatus = 'RUNTIME_ERROR';
            errorOutput = result.stderr.slice(0, 2000);
          }
        }
      } else {
        // Check output correctness
        passed = compareOutput(testCase.expectedOutput, result.stdout);
        if (passed) {
          passedCases++;
        } else if (finalStatus === 'ACCEPTED') {
          finalStatus = 'WRONG_ANSWER';
        }
      }

      testResults.push({
        testCaseId: testCase.id,
        passed,
        actualOutput: result.stdout.slice(0, 5000),
        runtimeMs,
        memoryKb,
      });

      // On compilation error, no point running more test cases
      if (finalStatus === 'COMPILATION_ERROR') {
        // Fill remaining test cases as not passed
        const remaining = testCases.slice(testResults.length);
        for (const tc of remaining) {
          testResults.push({
            testCaseId: tc.id,
            passed: false,
            actualOutput: null,
            runtimeMs: 0,
            memoryKb: 0,
          });
        }
        break;
      }
    }

    // Write results to database in a transaction
    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: finalStatus as 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR',
          runtimeMs: maxRuntimeMs,
          memoryKb: maxMemoryKb,
          passedCases,
          totalCases: testCases.length,
          errorOutput,
        },
      }),
      ...testResults.map((tr) =>
        prisma.submissionTestResult.create({
          data: {
            submissionId,
            testCaseId: tr.testCaseId,
            passed: tr.passed,
            actualOutput: tr.actualOutput,
            runtimeMs: tr.runtimeMs,
            memoryKb: tr.memoryKb,
          },
        }),
      ),
    ]);

    // Publish result for real-time updates
    const judgeResult: JudgeResult = {
      submissionId,
      status: finalStatus,
      runtimeMs: maxRuntimeMs,
      memoryKb: maxMemoryKb,
      passedCases,
      totalCases: testCases.length,
      errorOutput: errorOutput ?? undefined,
    };

    await publishResult(`judge:result:${submissionId}`, judgeResult);

    log.info(
      { status: finalStatus, passed: passedCases, total: testCases.length, runtimeMs: maxRuntimeMs },
      'Submission judged',
    );
  } catch (err) {
    log.error({ err }, 'Failed to process submission');

    // Attempt to mark as runtime error
    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'RUNTIME_ERROR',
          errorOutput: err instanceof Error ? err.message : 'Internal judge error',
        },
      });
    } catch (dbErr) {
      log.error({ err: dbErr }, 'Failed to update submission status after error');
    }
  }
}

// ── Custom Run Processing ────────────────────────────────────────────────────

async function processRun(job: RunJob): Promise<void> {
  const { jobId, code, language, input, timeLimitMs } = job;
  const log = logger.child({ jobId, language, workerId: WORKER_ID });

  log.info('Processing custom run');

  try {
    const langConfig = getLanguage(language);

    const result = await executeCode(
      code,
      langConfig,
      input,
      timeLimitMs,
      DEFAULT_MEMORY_LIMIT_MB,
    );

    const runResult: RunResult = {
      jobId,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      timedOut: result.timedOut,
    };

    await publishResult(`judge:run:${jobId}`, runResult);

    log.info({ runtimeMs: result.runtimeMs, exitCode: result.exitCode }, 'Custom run completed');
  } catch (err) {
    log.error({ err }, 'Failed to process custom run');

    // Publish error result
    const errorResult: RunResult = {
      jobId,
      stdout: '',
      stderr: err instanceof Error ? err.message : 'Internal judge error',
      exitCode: -1,
      runtimeMs: 0,
      memoryKb: 0,
      timedOut: false,
    };

    await publishResult(`judge:run:${jobId}`, errorResult);
  }
}

// ── Main Loop ────────────────────────────────────────────────────────────────

async function mainLoop(): Promise<void> {
  logger.info({ workerId: WORKER_ID }, 'Judge worker starting');

  await ensureGroup();

  logger.info({ workerId: WORKER_ID }, 'Consumer groups ready, entering main loop');

  while (running) {
    try {
      // Try to consume a submission job first
      const submissionJob = await consumeSubmission(WORKER_ID);
      if (submissionJob) {
        await processSubmission(submissionJob);
        await ackSubmission(submissionJob.messageId);
        continue; // Check for more work immediately
      }

      // Then try a custom run job
      const runJob = await consumeRun(WORKER_ID);
      if (runJob) {
        await processRun(runJob);
        await ackRun(runJob.messageId);
        continue;
      }

      // Both XREADGROUP calls block for 5s each, so no busy-wait needed
    } catch (err) {
      logger.error({ err, workerId: WORKER_ID }, 'Error in worker main loop');
      // Brief pause to avoid tight error loops
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// ── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string): void {
  logger.info({ signal, workerId: WORKER_ID }, 'Shutting down judge worker');
  running = false;

  // Give in-flight work time to finish, then force exit
  setTimeout(() => {
    logger.warn({ workerId: WORKER_ID }, 'Forced shutdown after timeout');
    process.exit(1);
  }, 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Entry Point ──────────────────────────────────────────────────────────────

mainLoop()
  .then(async () => {
    logger.info({ workerId: WORKER_ID }, 'Worker stopped gracefully');
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err, workerId: WORKER_ID }, 'Worker crashed');
    await prisma.$disconnect().catch(() => {});
    await redis.quit().catch(() => {});
    process.exit(1);
  });
