'use client';

import { Code2, CheckCircle2, Send, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpponentParticipant {
  userId: string;
  displayName: string;
  ready: boolean;
  submitted: boolean;
  verdict: string | null;
}

interface OpponentStatusProps {
  opponent: OpponentParticipant;
  ratingAtMatch?: number | null;
}

const VERDICT_CONFIG: Record<string, { label: string; className: string }> = {
  ACCEPTED: { label: 'Accepted', className: 'text-emerald-400' },
  WRONG_ANSWER: { label: 'Wrong Answer', className: 'text-red-400' },
  TIME_LIMIT_EXCEEDED: { label: 'TLE', className: 'text-yellow-400' },
  MEMORY_LIMIT_EXCEEDED: { label: 'MLE', className: 'text-orange-400' },
  RUNTIME_ERROR: { label: 'Runtime Error', className: 'text-red-400' },
  COMPILATION_ERROR: { label: 'Compile Error', className: 'text-purple-400' },
};

export function OpponentStatus({ opponent, ratingAtMatch }: OpponentStatusProps) {
  const getStatus = () => {
    if (opponent.verdict) {
      const cfg = VERDICT_CONFIG[opponent.verdict];
      if (cfg) {
        return { label: cfg.label, className: cfg.className, icon: <CheckCircle2 size={14} /> };
      }
    }
    if (opponent.submitted) {
      return {
        label: 'Submitted',
        className: 'text-blue-400',
        icon: <Send size={14} />,
      };
    }
    if (opponent.ready) {
      return {
        label: 'Coding...',
        className: 'text-slate-300',
        icon: <Code2 size={14} className="animate-pulse" />,
      };
    }
    return {
      label: 'Waiting',
      className: 'text-slate-500',
      icon: <Loader2 size={14} className="animate-spin" />,
    };
  };

  const status = getStatus();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Opponent</div>

      {/* Anonymous avatar */}
      <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
        <User size={22} className="text-slate-500" />
      </div>

      {/* Anonymized name */}
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-300">
          {opponent.displayName.slice(0, 2)}***
        </p>
        {ratingAtMatch && (
          <p className="text-xs text-slate-500 mt-0.5">{ratingAtMatch} rating</p>
        )}
      </div>

      {/* Status indicator */}
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', status.className)}>
        {status.icon}
        {status.label}
      </div>

      {/* Status bar visual */}
      <div className="w-full space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span>Ready</span>
          <div className={cn('w-2 h-2 rounded-full', opponent.ready ? 'bg-emerald-500' : 'bg-slate-700')} />
        </div>
        <div className="flex items-center justify-between">
          <span>Submitted</span>
          <div className={cn('w-2 h-2 rounded-full', opponent.submitted ? 'bg-blue-500' : 'bg-slate-700')} />
        </div>
        <div className="flex items-center justify-between">
          <span>Verdict</span>
          <div className={cn(
            'w-2 h-2 rounded-full',
            opponent.verdict === 'ACCEPTED' ? 'bg-emerald-500'
              : opponent.verdict ? 'bg-red-500'
                : 'bg-slate-700'
          )} />
        </div>
      </div>
    </div>
  );
}
