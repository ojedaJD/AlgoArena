export enum SubmissionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
}

export type Verdict = SubmissionStatus;

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  matchId: string | null;
  language: string;
  code: string;
  status: SubmissionStatus;
  runtimeMs: number | null;
  memoryKb: number | null;
  passedCases: number;
  totalCases: number;
  errorOutput: string | null;
  createdAt: string;
}

export interface SubmissionTestResult {
  id: string;
  submissionId: string;
  testCaseId: string;
  passed: boolean;
  actualOutput: string | null;
  runtimeMs: number;
  memoryKb: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  memoryKb: number;
  timedOut: boolean;
}
