'use client';

import Link from 'next/link';
import { Trophy, Star, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantResult {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  verdict: string | null;
  runtimeMs: number | null;
  passedCases: number;
  totalCases: number;
  ratingDelta: number;
  xpEarned: number;
}

interface MatchResultProps {
  winnerId: string | null;
  currentUserId: string;
  participants: ParticipantResult[];
  onPlayAgain?: () => void;
}

export function MatchResult({ winnerId, currentUserId, participants, onPlayAgain }: MatchResultProps) {
  const me = participants.find((p) => p.userId === currentUserId);
  const opponent = participants.find((p) => p.userId !== currentUserId);
  const isWinner = winnerId === currentUserId;
  const isDraw = winnerId === null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Result banner */}
        <div className={cn(
          'text-center py-8 rounded-2xl mb-6 border',
          isWinner
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : isDraw
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-slate-900 border-slate-800'
        )}>
          {isWinner ? (
            <>
              <Trophy size={48} className="text-yellow-400 mx-auto mb-3" />
              <h1 className="text-4xl font-black text-yellow-300">Victory!</h1>
              <p className="text-slate-400 mt-2">Excellent work. You solved it first!</p>
            </>
          ) : isDraw ? (
            <>
              <Minus size={48} className="text-blue-400 mx-auto mb-3" />
              <h1 className="text-4xl font-black text-blue-300">Draw</h1>
              <p className="text-slate-400 mt-2">Match ended in a draw</p>
            </>
          ) : (
            <>
              <XCircle size={48} className="text-slate-500 mx-auto mb-3" />
              <h1 className="text-4xl font-black text-slate-300">Defeat</h1>
              <p className="text-slate-500 mt-2">Your opponent was faster this time</p>
            </>
          )}
        </div>

        {/* Stats comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {participants.map((p) => (
            <div
              key={p.userId}
              className={cn(
                'bg-slate-900 rounded-xl border p-5',
                p.userId === winnerId
                  ? 'border-yellow-500/40'
                  : 'border-slate-800'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                {p.userId === winnerId && <Trophy size={16} className="text-yellow-400" />}
                <span className={cn(
                  'text-sm font-semibold',
                  p.isCurrentUser ? 'text-blue-400' : 'text-slate-300'
                )}>
                  {p.displayName}
                  {p.isCurrentUser && <span className="text-slate-500 text-xs ml-1">(you)</span>}
                </span>
              </div>

              {/* Verdict */}
              <div className="mb-3">
                <span className={cn(
                  'flex items-center gap-1.5 text-sm font-medium',
                  p.verdict === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {p.verdict === 'ACCEPTED' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {p.verdict ?? 'No submission'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Test cases</span>
                  <span className={cn(
                    'font-medium',
                    p.passedCases === p.totalCases ? 'text-emerald-400' : 'text-slate-300'
                  )}>
                    {p.passedCases}/{p.totalCases}
                  </span>
                </div>
                {p.runtimeMs !== null && (
                  <div className="flex justify-between">
                    <span>Runtime</span>
                    <span className="text-slate-300 font-medium">{p.runtimeMs}ms</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* My rating / XP changes */}
        {me && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Your Progress
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {me.ratingDelta >= 0 ? (
                  <TrendingUp size={20} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={20} className="text-red-400" />
                )}
                <div>
                  <p className="text-xs text-slate-500">Rating change</p>
                  <p className={cn(
                    'text-lg font-bold',
                    me.ratingDelta > 0 ? 'text-emerald-400' : me.ratingDelta < 0 ? 'text-red-400' : 'text-slate-400'
                  )}>
                    {me.ratingDelta > 0 ? '+' : ''}{me.ratingDelta}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star size={20} className="text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-500">XP earned</p>
                  <p className="text-lg font-bold text-yellow-400">+{me.xpEarned} XP</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              <RefreshCw size={16} />
              Play Again
            </button>
          )}
          <Link
            href="/problems"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Back to Problems
          </Link>
        </div>
      </div>
    </div>
  );
}
