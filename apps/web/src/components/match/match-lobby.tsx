'use client';

import { useState } from 'react';
import { Sword, Users, Loader2, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchApi } from '@/lib/api-client';
import { MatchMode } from '@dsa/shared';

interface QueueStatus {
  inQueue: boolean;
  position?: number;
  estimatedWaitMs?: number;
}

interface MatchLobbyProps {
  onMatchFound?: (matchId: string) => void;
}

export function MatchLobby({ onMatchFound }: MatchLobbyProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ inQueue: false });
  const [isJoining, setIsJoining] = useState(false);
  const [friendCode, setFriendCode] = useState('');

  const handleJoinRanked = async () => {
    setIsJoining(true);
    try {
      await matchApi.joinQueue('RANKED');
      setQueueStatus({ inQueue: true, position: 1 });
    } catch (err) {
      console.error('Failed to join queue', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await matchApi.leaveQueue();
      setQueueStatus({ inQueue: false });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Sword size={40} className="text-blue-400 mx-auto mb-3" />
          <h1 className="text-3xl font-black text-slate-100">Compete</h1>
          <p className="text-slate-400 mt-2">Challenge others in real-time coding battles</p>
        </div>

        {/* Queue status */}
        {queueStatus.inQueue && (
          <div className="mb-6 bg-blue-950/40 border border-blue-500/30 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="font-semibold">Searching for opponent...</span>
            </div>
            {queueStatus.position !== undefined && (
              <p className="text-xs text-slate-400">
                Queue position: <strong className="text-slate-200">#{queueStatus.position}</strong>
              </p>
            )}
            {queueStatus.estimatedWaitMs !== undefined && (
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Clock size={11} />
                Est. wait: ~{Math.ceil(queueStatus.estimatedWaitMs / 1000)}s
              </p>
            )}
            <button
              onClick={handleLeaveQueue}
              className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        )}

        {!queueStatus.inQueue && (
          <div className="space-y-4">
            {/* Ranked match */}
            <button
              onClick={handleJoinRanked}
              disabled={isJoining}
              className={cn(
                'w-full flex items-center gap-4 p-5 rounded-xl border transition-all',
                'bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-400/50',
                'group'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                <Sword size={22} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-200">Ranked Match</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compete for rating points. Matched by skill level.
                </p>
              </div>
            </button>

            {/* Friend challenge */}
            <div className={cn(
              'w-full p-5 rounded-xl border',
              'bg-slate-900 border-slate-800'
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Users size={22} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Challenge a Friend</p>
                  <p className="text-xs text-slate-400 mt-0.5">Casual match, no rating change</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value)}
                  placeholder="Enter friend's username..."
                  className={cn(
                    'flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300',
                    'focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600'
                  )}
                />
                <button
                  disabled={!friendCode.trim()}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Online Now', value: '1.2k' },
            { label: 'In Queue', value: '47' },
            { label: 'Active Matches', value: '203' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-lg py-3">
              <p className="text-lg font-bold text-slate-200">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
