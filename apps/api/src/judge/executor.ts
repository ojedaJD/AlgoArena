import Docker from 'dockerode';
import * as tar from 'tar-stream';
import { Writable } from 'node:stream';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';
import type { LanguageConfig } from './languages/index.js';

const docker = new Docker({ socketPath: config.JUDGE_DOCKER_SOCKET });

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB cap on stdout/stderr
const CONTAINER_LABEL = 'dsa-judge-sandbox';
const COMPILE_TIMEOUT_MS = 15_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  memoryKb: number;
  timedOut: boolean;
  oomKilled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a tar archive containing the source file.
 */
function buildTarBuffer(filename: string, code: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    pack.entry({ name: filename }, code, (err) => {
      if (err) return reject(err);
      pack.finalize();
    });

    const chunks: Buffer[] = [];
    pack.on('data', (chunk: Buffer) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);
  });
}

/**
 * Collect stream output up to a byte limit.
 */
function createLimitedCollector(limit: number): { stream: Writable; getOutput: () => string } {
  let collected = Buffer.alloc(0);
  let truncated = false;

  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (!truncated) {
        const remaining = limit - collected.length;
        if (chunk.length <= remaining) {
          collected = Buffer.concat([collected, chunk]);
        } else {
          collected = Buffer.concat([collected, chunk.subarray(0, remaining)]);
          truncated = true;
        }
      }
      callback();
    },
  });

  return {
    stream,
    getOutput: () => {
      const text = collected.toString('utf-8');
      return truncated ? text + '\n[output truncated]' : text;
    },
  };
}

/**
 * Demux Docker attach stream (multiplexed stdout/stderr) into separate writers.
 */
function demuxStream(
  dockerStream: NodeJS.ReadableStream,
  stdout: Writable,
  stderr: Writable,
): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.modem.demuxStream(dockerStream, stdout, stderr);
    dockerStream.on('end', resolve);
    dockerStream.on('error', reject);
  });
}

/**
 * Execute a command inside a running container via docker exec.
 */
async function execInContainer(
  container: Docker.Container,
  cmd: string[],
  stdin?: string,
  timeoutMs?: number,
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: !!stdin,
  });

  const execStream = await exec.start({
    hijack: true,
    stdin: !!stdin,
  });

  // Write stdin if provided then close the write side
  if (stdin) {
    execStream.write(stdin);
    execStream.end();
  }

  const stdoutCollector = createLimitedCollector(MAX_OUTPUT_BYTES);
  const stderrCollector = createLimitedCollector(MAX_OUTPUT_BYTES);

  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<void>((resolve) => {
    if (timeoutMs) {
      timer = setTimeout(async () => {
        timedOut = true;
        try {
          await container.kill({ signal: 'SIGKILL' });
        } catch {
          // Container may already be stopped
        }
        resolve();
      }, timeoutMs);
    }
  });

  const streamPromise = demuxStream(execStream, stdoutCollector.stream, stderrCollector.stream);

  if (timeoutMs) {
    await Promise.race([streamPromise, timeoutPromise]);
  } else {
    await streamPromise;
  }

  if (timer) clearTimeout(timer);

  let exitCode = 1;
  if (!timedOut) {
    const inspection = await exec.inspect();
    exitCode = inspection.ExitCode ?? 1;
  }

  return {
    stdout: stdoutCollector.getOutput(),
    stderr: stderrCollector.getOutput(),
    exitCode,
    timedOut,
  };
}

// ── Main Executor ────────────────────────────────────────────────────────────

/**
 * Execute user code in a fully sandboxed Docker container.
 *
 * Security measures:
 * - Network disabled (no internet access)
 * - Non-root user (1000:1000)
 * - Read-only root filesystem
 * - Memory capped (no swap)
 * - PID limit (64)
 * - All capabilities dropped
 * - no-new-privileges
 * - tmpfs for /sandbox and /tmp (size-limited)
 * - Compiled languages get exec on /sandbox; interpreted get noexec
 * - Output capped at 1 MB
 * - Timeout enforcement via SIGKILL
 */
export async function executeCode(
  code: string,
  language: LanguageConfig,
  input: string,
  timeLimitMs: number,
  memoryLimitMb: number,
): Promise<ExecutionResult> {
  const filename =
    language.name === 'java'
      ? `Solution${language.extension}`
      : `solution${language.extension}`;

  // Compiled languages need exec permission on /sandbox to run binaries
  const needsExec = language.compileCmd !== null;
  const sandboxFlags = needsExec
    ? 'rw,nosuid,size=64m'
    : 'rw,noexec,nosuid,size=64m';

  let container: Docker.Container | undefined;

  try {
    // ── 1. Create sandboxed container ──────────────────────────────────────
    container = await docker.createContainer({
      Image: language.image,
      Labels: { managed: CONTAINER_LABEL },
      NetworkDisabled: true,
      User: '1000:1000',
      // Keep the container alive so we can exec compile + run steps
      Cmd: ['sleep', '120'],
      HostConfig: {
        ReadonlyRootfs: true,
        Tmpfs: {
          '/sandbox': sandboxFlags,
          '/tmp': 'rw,noexec,nosuid,size=32m',
        },
        Memory: memoryLimitMb * 1024 * 1024,
        MemorySwap: memoryLimitMb * 1024 * 1024, // Same as Memory = no swap
        NanoCpus: 1_000_000_000, // 1 CPU
        PidsLimit: 64,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        AutoRemove: false,
      },
    });

    await container.start();

    // ── 2. Inject source code via tar archive ──────────────────────────────
    const tarBuffer = await buildTarBuffer(filename, code);
    await container.putArchive(tarBuffer, { path: '/sandbox' });

    // ── 3. Compile (if needed) ─────────────────────────────────────────────
    if (language.compileCmd) {
      const compileResult = await execInContainer(
        container,
        ['/bin/sh', '-c', language.compileCmd],
        undefined,
        COMPILE_TIMEOUT_MS,
      );

      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.stderr || compileResult.stdout,
          exitCode: compileResult.exitCode,
          runtimeMs: 0,
          memoryKb: 0,
          timedOut: false,
          oomKilled: false,
        };
      }
    }

    // ── 4. Run the solution with stdin input ───────────────────────────────
    const startTime = performance.now();

    const runResult = await execInContainer(
      container,
      ['/bin/sh', '-c', language.runCmd],
      input,
      timeLimitMs,
    );

    const runtimeMs = Math.round(performance.now() - startTime);

    // ── 5. Inspect for OOM and memory usage ────────────────────────────────
    let oomKilled = false;
    let memoryKb = 0;

    try {
      const inspection = await container.inspect();
      oomKilled = inspection.State?.OOMKilled ?? false;
    } catch {
      // Container may be gone after OOM kill
    }

    try {
      const stats = (await container.stats({ stream: false })) as unknown as {
        memory_stats?: { usage?: number };
      };
      if (stats.memory_stats?.usage) {
        memoryKb = Math.round(stats.memory_stats.usage / 1024);
      }
    } catch {
      // Stats not always available
    }

    // ── 6. Return result ───────────────────────────────────────────────────
    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.timedOut ? -1 : runResult.exitCode,
      runtimeMs,
      memoryKb,
      timedOut: runResult.timedOut,
      oomKilled,
    };
  } catch (err) {
    logger.error({ err, language: language.name }, 'Executor error');
    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : 'Internal judge error',
      exitCode: -1,
      runtimeMs: 0,
      memoryKb: 0,
      timedOut: false,
      oomKilled: false,
    };
  } finally {
    // ── 7. Force-remove container ──────────────────────────────────────────
    if (container) {
      try {
        await container.stop({ t: 0 }).catch(() => {});
        await container.remove({ force: true, v: true });
      } catch (err) {
        logger.warn({ err }, 'Failed to clean up sandbox container');
      }
    }
  }
}
