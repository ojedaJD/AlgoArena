export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  statementMd: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  tags: string[];
  topicIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  solvedByUser?: boolean;
}

export interface TestCase {
  id: string;
  problemId: string;
  isPublic: boolean;
  input: string;
  expectedOutput: string;
  orderIndex: number;
}
