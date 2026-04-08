'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMatch } from '@/hooks/use-match';
import { MatchRoom } from '@/components/match/match-room';
import { MatchResult } from '@/components/match/match-result';
import { problemsApi } from '@/lib/api-client';
import type { Problem } from '@dsa/shared';

// TODO: Get currentUserId from auth context/session
const CURRENT_USER_ID = 'me';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [matchEndData, setMatchEndData] = useState<{
    winnerId: string | null;
    reason: string;
    ratingDelta?: Record<string, number>;
  } | null>(null);

  const { matchState, matchData, isLoading, error, submitCode } = useMatch({
    matchId,
    currentUserId: CURRENT_USER_ID,
    onMatchEnded: (data) => setMatchEndData(data),
  });

  // Load problem when match state provides the slug
  useEffect(() => {
    if (!matchState?.problemSlug) return;
    setProblemError(null);
    problemsApi
      .getBySlug(matchState.problemSlug)
      .then((p: unknown) => setProblem(p as Problem))
      .catch((err: Error) => setProblemError(err.message));
  }, [matchState?.problemSlug]);

  if (isLoading || (!matchState && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p>Loading match...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-slate-200 font-medium">{error}</p>
        <button
          onClick={() => router.push('/compete')}
          className="mt-4 text-blue-400 hover:underline text-sm"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // Show result screen after match ends
  if (matchEndData && matchData) {
    const participants = matchData.participants.map((p) => ({
      userId: p.userId,
      displayName: `Player ${p.userId.slice(0, 4)}`,
      isCurrentUser: p.userId === CURRENT_USER_ID,
      verdict:
        matchData.winnerId === p.userId ? 'ACCEPTED' : p.submissionId ? 'WRONG_ANSWER' : null,
      runtimeMs: null,
      passedCases: 0,
      totalCases: 0,
      ratingDelta: matchEndData.ratingDelta?.[p.userId] ?? 0,
      xpEarned: matchEndData.winnerId === p.userId ? 150 : 50,
    }));

    return (
      <MatchResult
        winnerId={matchEndData.winnerId}
        currentUserId={CURRENT_USER_ID}
        participants={participants}
        onPlayAgain={() => router.push('/compete')}
      />
    );
  }

  if (!matchState || !problem) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p>{problemError ?? 'Waiting for match to start...'}</p>
      </div>
    );
  }

  return (
    <MatchRoom
      matchState={matchState}
      problem={problem}
      currentUserId={CURRENT_USER_ID}
      onSubmit={submitCode}
    />
  );
}
