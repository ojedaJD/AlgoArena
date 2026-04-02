export enum MatchStatus {
  WAITING = 'WAITING',
  READY_CHECK = 'READY_CHECK',
  CODING = 'CODING',
  JUDGING = 'JUDGING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MatchMode {
  RANKED = 'RANKED',
  CASUAL = 'CASUAL',
  FRIEND = 'FRIEND',
}

export interface Match {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  problemId: string | null;
  winnerId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  ratingDelta: Record<string, number> | null;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  ratingAtMatch: number | null;
  submissionId: string | null;
  score: number;
  readyAt: string | null;
}

export interface MatchWithParticipants extends Match {
  participants: MatchParticipant[];
}

export interface MatchRoomState {
  matchId: string;
  status: MatchStatus;
  problemSlug: string | null;
  timeRemainingMs: number;
  participants: {
    userId: string;
    displayName: string;
    ready: boolean;
    submitted: boolean;
    verdict: string | null;
  }[];
}
