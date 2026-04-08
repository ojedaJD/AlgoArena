'use client';

import { useState, useEffect } from 'react';
import { MatchLobby } from '@/components/match/match-lobby';
import { matchApi } from '@/lib/api-client';
import type { MatchWithParticipants } from '@dsa/shared';
import { MatchStatus } from '@dsa/shared';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Sword, Trophy, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Partial<Record<MatchStatus, { label: string; className: string }>> = {
  [MatchStatus.COMPLETED]: { label: 'Completed', className: 'text-slate-400' },
  [MatchStatus.CANCELLED]: { label: 'Cancelled', className: 'text-slate-600' },
};

function RecentMatchRow({ match, currentUserId }: { match: MatchWithParticipants; currentUserId: string }) {
  const me = match.participants.find((p) => p.userId === currentUserId);
  const isWinner = match.winnerId === currentUserId;
  const isDraw = match.winnerId === null && match.status === MatchStatus.COMPLETED;
  const ratingDelta = match.ratingDelta?.[currentUserId] ?? 0;

  return (
    <Link
      href={`/compete/${match.id}`}
      className="flex items-center gap-4 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 hover:border-slate-700 transition-all"
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isWinner ? 'bg-yellow-500/20' : isDraw ? 'bg-blue-500/20' : 'bg-slate-800'
      )}>
        {isWinner ? (
          <Trophy size={14} className="text-yellow-400" />
        ) : isDraw ? (
          <Sword size={14} className="text-blue-400" />
        ) : (
          <XCircle size={14} className="text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 font-medium">
          {isWinner ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          <Clock size={10} />
          {match.endedAt ? formatRelativeTime(match.endedAt) : '—'}
        </p>
      </div>
      <div className={cn(
        'text-sm font-bold',
        ratingDelta > 0 ? 'text-emerald-400' : ratingDelta < 0 ? 'text-red-400' : 'text-slate-500'
      )}>
        {ratingDelta > 0 ? '+' : ''}{ratingDelta}
      </div>
    </Link>
  );
}

export default function CompetePage() {
  const [recentMatches, setRecentMatches] = useState<MatchWithParticipants[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  // TODO: get currentUserId from auth context
  const currentUserId = 'me';

  useEffect(() => {
    setIsLoadingMatches(true);
    matchApi
      .getHistory({ limit: 5 })
      .then((data) => setRecentMatches((data.data || []) as MatchWithParticipants[]))
      .catch(() => setRecentMatches([]))
      .finally(() => setIsLoadingMatches(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Lobby */}
        <div className="mb-10">
          <MatchLobby />
        </div>

        {/* Recent matches */}
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            Recent Matches
          </h2>
          <div className="space-y-1.5">
            {isLoadingMatches
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
                ))
              : recentMatches.length === 0
                ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No recent matches. Jump in!
                  </p>
                )
                : recentMatches.map((m) => (
                    <RecentMatchRow key={m.id} match={m} currentUserId={currentUserId} />
                  ))}
          </div>
        </div>
      </div>
    </div>
  );
}
