import type { MatchRoomState } from './match';

export interface ServerToClientEvents {
  'match:state': (state: MatchRoomState) => void;
  'match:countdown': (data: { timeRemainingMs: number }) => void;
  'match:opponent_submitted': (data: { userId: string }) => void;
  'match:opponent_verdict': (data: { userId: string; verdict: string }) => void;
  'match:ended': (data: {
    winnerId: string | null;
    reason: string;
    ratingDelta?: Record<string, number>;
  }) => void;
  'match:cancelled': (data: { reason: string }) => void;
  'matchmaking:found': (data: { matchId: string }) => void;
  'matchmaking:status': (data: { position: number; estimatedWaitMs: number }) => void;
  'notification': (data: { type: string; title: string; body: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'match:join': (data: { matchId: string }) => void;
  'match:ready': (data: { matchId: string }) => void;
  'match:submit': (data: { matchId: string; code: string; language: string }) => void;
  'match:leave': (data: { matchId: string }) => void;
  'matchmaking:join': (data: { mode: string }) => void;
  'matchmaking:cancel': () => void;
}
