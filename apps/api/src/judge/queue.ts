import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

const STREAM_KEY = 'judge:queue';
const RUN_STREAM = 'judge:run';
const GROUP = 'judge-workers';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubmissionJob {
  messageId: string;
  submissionId: string;
  code: string;
  language: string;
  problemId: string;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface RunJob {
  messageId: string;
  jobId: string;
  code: string;
  language: string;
  input: string;
  timeLimitMs: number;
}

export interface JudgeResult {
  submissionId: string;
  status: string;
  runtimeMs: number;
  memoryKb: number;
  passedCases: number;
  totalCases: number;
  errorOutput?: string;
}

export interface RunResult {
  jobId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  memoryKb: number;
  timedOut: boolean;
}

// ── Consumer Group Setup ─────────────────────────────────────────────────────

export async function ensureGroup(): Promise<void> {
  for (const stream of [STREAM_KEY, RUN_STREAM]) {
    try {
      await redis.xgroup('CREATE', stream, GROUP, '0', 'MKSTREAM');
      logger.info(`Created consumer group "${GROUP}" on stream "${stream}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Group already exists - this is fine
      if (message.includes('BUSYGROUP')) {
        logger.debug(`Consumer group "${GROUP}" already exists on "${stream}"`);
      } else {
        throw err;
      }
    }
  }
}

// ── Enqueue ──────────────────────────────────────────────────────────────────

export async function enqueueSubmission(
  submissionId: string,
  code: string,
  language: string,
  problemId: string,
  timeLimitMs: number,
  memoryLimitMb: number,
): Promise<string> {
  const messageId = await redis.xadd(
    STREAM_KEY,
    '*',
    'submissionId', submissionId,
    'code', code,
    'language', language,
    'problemId', problemId,
    'timeLimitMs', String(timeLimitMs),
    'memoryLimitMb', String(memoryLimitMb),
  );

  logger.info({ submissionId, messageId }, 'Enqueued submission');
  return messageId!;
}

export async function enqueueRun(
  jobId: string,
  code: string,
  language: string,
  input: string,
  timeLimitMs: number,
): Promise<string> {
  const messageId = await redis.xadd(
    RUN_STREAM,
    '*',
    'jobId', jobId,
    'code', code,
    'language', language,
    'input', input,
    'timeLimitMs', String(timeLimitMs),
  );

  logger.info({ jobId, messageId }, 'Enqueued custom run');
  return messageId!;
}

// ── Consume ──────────────────────────────────────────────────────────────────

async function consumeFromStream<T>(
  stream: string,
  workerId: string,
  parser: (fields: string[], messageId: string) => T,
): Promise<T | null> {
  const result = await redis.xreadgroup(
    'GROUP', GROUP, workerId,
    'COUNT', '1',
    'BLOCK', '5000',
    'STREAMS', stream, '>',
  );

  if (!result || result.length === 0) {
    return null;
  }

  const [, messages] = result[0] as [string, [string, string[]][]];
  if (!messages || messages.length === 0) {
    return null;
  }

  const [messageId, fields] = messages[0];
  return parser(fields, messageId);
}

function parseStringPairs(fields: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    map[fields[i]] = fields[i + 1];
  }
  return map;
}

export async function consumeSubmission(workerId: string): Promise<SubmissionJob | null> {
  return consumeFromStream<SubmissionJob>(STREAM_KEY, workerId, (fields, messageId) => {
    const data = parseStringPairs(fields);
    return {
      messageId,
      submissionId: data.submissionId,
      code: data.code,
      language: data.language,
      problemId: data.problemId,
      timeLimitMs: parseInt(data.timeLimitMs, 10),
      memoryLimitMb: parseInt(data.memoryLimitMb, 10),
    };
  });
}

export async function consumeRun(workerId: string): Promise<RunJob | null> {
  return consumeFromStream<RunJob>(RUN_STREAM, workerId, (fields, messageId) => {
    const data = parseStringPairs(fields);
    return {
      messageId,
      jobId: data.jobId,
      code: data.code,
      language: data.language,
      input: data.input,
      timeLimitMs: parseInt(data.timeLimitMs, 10),
    };
  });
}

// ── Acknowledge ──────────────────────────────────────────────────────────────

export async function ackSubmission(messageId: string): Promise<void> {
  await redis.xack(STREAM_KEY, GROUP, messageId);
}

export async function ackRun(messageId: string): Promise<void> {
  await redis.xack(RUN_STREAM, GROUP, messageId);
}

// ── Publish Real-Time Results ────────────────────────────────────────────────

export async function publishResult(channel: string, result: JudgeResult | RunResult): Promise<void> {
  await redis.publish(channel, JSON.stringify(result));
  logger.debug({ channel }, 'Published result');
}
