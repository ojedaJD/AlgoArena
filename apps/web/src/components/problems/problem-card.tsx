'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Difficulty, type ProblemSummary } from '@dsa/shared';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  [Difficulty.EASY]: {
    label: 'Easy',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  [Difficulty.MEDIUM]: {
    label: 'Medium',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  [Difficulty.HARD]: {
    label: 'Hard',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

interface ProblemCardProps {
  problem: ProblemSummary;
  index?: number;
}

export function ProblemCard({ problem, index }: ProblemCardProps) {
  const difficulty = DIFFICULTY_CONFIG[problem.difficulty];

  return (
    <Link
      href={`/problems/${problem.slug}`}
      className={cn(
        'group flex items-center gap-4 px-4 py-3 rounded-lg',
        'bg-slate-900 border border-slate-800',
        'hover:border-slate-600 hover:bg-slate-800/80',
        'transition-all duration-150'
      )}
    >
      {/* Index */}
      {index !== undefined && (
        <span className="text-xs text-slate-600 font-mono w-8 shrink-0 text-right">
          {index + 1}.
        </span>
      )}

      {/* Solved checkmark */}
      <div className="w-5 shrink-0">
        {problem.solvedByUser ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-slate-700" />
        )}
      </div>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
        {problem.title}
      </span>

      {/* Tags */}
      {problem.tags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          {problem.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-slate-700"
            >
              {tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span className="text-[11px] text-slate-600">+{problem.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Difficulty badge */}
      <span
        className={cn(
          'shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          difficulty.className
        )}
      >
        {difficulty.label}
      </span>
    </Link>
  );
}
