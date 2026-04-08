'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket, useSocketEmit } from './use-socket';
import { matchApi } from '@/lib/api-client';
import type { MatchRoomState, MatchWithParticipants } from '@dsa/shared';
import { MatchStatus } from '@dsa/shared';

interface UseMatchOptions {
  matchId: string;
  currentUserId: string;
  onMatchEnded?: (data: { winnerId: string | null; reason: string; ratingDelta?: Record<string, number> }) => void;
}

interface UseMatchReturn {
  matchState: MatchRoomState | null;
  matchData: MatchWithParticipants | null;
  isLoading: boolean;
  error: string | null;
  submitCode: (code: string, language: string) => void;
  joinMatch: () => void;
  leaveMatch: () => void;
}

export function useMatch({ matchId, currentUserId, onMatchEnded }: UseMatchOptions): UseMatchReturn {
  const [matchState, setMatchState] = useState<MatchRoomState | null>(null);
  const [matchData, setMatchData] = useState<MatchWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const emit = useSocketEmit();
  const hasJoined = useRef(false);

  // Load match data from REST
  useEffect(() => {
    setIsLoading(true);
    matchApi
      .getMatch(matchId)
      .then((data) => setMatchData(data as MatchWithParticipants))
      .catch((err: any) => setError(err.message ?? 'Failed to load match'))
      .finally(() => setIsLoading(false));
  }, [matchId]);

  // Join the match room via WebSocket
  const joinMatch = useCallback(() => {
    if (!hasJoined.current) {
      emit('match:join', { matchId });
      hasJoined.current = true;
    }
  }, [emit, matchId]);

  // Leave match room
  const leaveMatch = useCallback(() => {
    emit('match:leave', { matchId });
    hasJoined.current = false;
  }, [emit, matchId]);

  // Auto-join on mount
  useEffect(() => {
    joinMatch();
    return () => leaveMatch();
  }, [joinMatch, leaveMatch]);

  // Listen for match state updates
  useSocket('match:state', (state) => {
    setMatchState(state);
  });

  // Listen for countdown updates
  useSocket('match:countdown', ({ timeRemainingMs }) => {
    setMatchState((prev) =>
      prev ? { ...prev, timeRemainingMs } : prev
    );
  });

  // Listen for opponent events
  useSocket('match:opponent_submitted', ({ userId }) => {
    setMatchState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.userId === userId ? { ...p, submitted: true } : p
        ),
      };
    });
  });

  useSocket('match:opponent_verdict', ({ userId, verdict }) => {
    setMatchState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.userId === userId ? { ...p, verdict } : p
        ),
      };
    });
  });

  // Match ended
  useSocket('match:ended', (data) => {
    onMatchEnded?.(data);
  });

  // Error
  useSocket('error', ({ message }) => {
    setError(message);
  });

  const submitCode = useCallback(
    (code: string, language: string) => {
      emit('match:submit', { matchId, code, language });
    },
    [emit, matchId]
  );

  return {
    matchState,
    matchData,
    isLoading,
    error,
    submitCode,
    joinMatch,
    leaveMatch,
  };
}
