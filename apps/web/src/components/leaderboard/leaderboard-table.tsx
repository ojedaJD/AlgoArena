'use client';

import Link from 'next/link';
import { cn, getInitials } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  matchesPlayed: number;
  wins: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

const MEDAL_CONFIG: Record<number, { bg: string; text: string; border: string; emoji: string }> = {
  1: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', emoji: '🥇' },
  2: { bg: 'bg-slate-400/10', text: 'text-slate-300', border: 'border-slate-400/30', emoji: '🥈' },
  3: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', emoji: '🥉' },
};

function RankCell({ rank }: { rank: number }) {
  const medal = MEDAL_CONFIG[rank];
  if (medal) {
    return (
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm border',
        medal.bg, medal.border
      )}>
        {medal.emoji}
      </div>
    );
  }
  return (
    <span className="w-8 text-center text-sm text-slate-500 font-mono">
      {rank}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="w-8 h-8 bg-slate-800 rounded-full" /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-full" />
          <div className="h-3 bg-slate-800 rounded w-28" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded w-12" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-800 rounded w-16" /></td>
    </tr>
  );
}

export function LeaderboardTable({ entries, currentUserId, isLoading }: LeaderboardTableProps) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-800">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Player
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Rating
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Matches
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Win Rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              const winRate = entry.matchesPlayed > 0
                ? Math.round((entry.wins / entry.matchesPlayed) * 100)
                : 0;
              const medal = MEDAL_CONFIG[entry.rank];

              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    'transition-colors',
                    isCurrentUser
                      ? 'bg-blue-950/30 hover:bg-blue-950/40'
                      : 'bg-slate-950 hover:bg-slate-900/60',
                    medal && !isCurrentUser ? medal.bg : ''
                  )}
                >
                  <td className="px-4 py-3">
                    <RankCell rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/profile/${entry.userId}`}
                      className="flex items-center gap-3 group"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(entry.displayName)
                        )}
                      </div>
                      <span className={cn(
                        'font-medium group-hover:underline',
                        isCurrentUser ? 'text-blue-400' : 'text-slate-200',
                        medal ? MEDAL_CONFIG[entry.rank]?.text : ''
                      )}>
                        {entry.displayName}
                        {isCurrentUser && (
                          <span className="text-xs text-slate-500 ml-1 no-underline">(you)</span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-bold',
                      medal ? MEDAL_CONFIG[entry.rank]?.text : 'text-slate-200'
                    )}>
                      {entry.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {entry.matchesPlayed}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-sm font-medium',
                      winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-slate-300' : 'text-red-400'
                    )}>
                      {winRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
