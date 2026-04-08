'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leaderboardApi } from '@/lib/api-client';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';

type Tab = 'global' | 'friends';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  matchesPlayed: number;
  wins: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Get currentUserId from auth context
  const currentUserId = 'me';

  useEffect(() => {
    setIsLoading(true);
    const fetch = activeTab === 'global'
      ? leaderboardApi.global({ limit: 50 })
      : leaderboardApi.friends();

    fetch
      .then((data) => setEntries((data as { entries: LeaderboardEntry[] }).entries))
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, [activeTab]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'global', label: 'Global', icon: <Globe size={14} /> },
    { id: 'friends', label: 'Friends', icon: <Users size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={22} className="text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Top players ranked by rating</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium (global only) */}
        {activeTab === 'global' && !isLoading && entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const heightClass = rank === 1 ? 'pt-0' : 'pt-6';
              const medalColors = ['bg-slate-400/10 border-slate-400/30', 'bg-yellow-500/10 border-yellow-500/30', 'bg-orange-500/10 border-orange-500/30'];
              const textColors = ['text-slate-300', 'text-yellow-400', 'text-orange-400'];
              const emojis = ['🥈', '🥇', '🥉'];

              return (
                <div key={entry.userId} className={cn('flex flex-col items-center', heightClass)}>
                  <div className={cn(
                    'w-full flex flex-col items-center gap-2 p-4 rounded-xl border',
                    medalColors[i]
                  )}>
                    <span className="text-2xl">{emojis[i]}</span>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full object-cover" />
                      ) : (
                        entry.displayName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <p className={cn('text-xs font-semibold text-center truncate w-full', textColors[i])}>
                      {entry.displayName}
                    </p>
                    <p className={cn('text-lg font-black', textColors[i])}>{entry.rating}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <LeaderboardTable
          entries={activeTab === 'global' ? entries.slice(3) : entries}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
