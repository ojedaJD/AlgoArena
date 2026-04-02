'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XpBarProps {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
  compact?: boolean;
}

function computeXpProgress(totalXp: number, level: number, xpToNextLevel: number): number {
  // XP needed for current level = total - xpToNextLevel remainder
  // This gives progress within the current level as a percentage
  if (xpToNextLevel <= 0) return 100;
  // Assume each level needs roughly the same XP ceiling as xpToNextLevel represents remaining
  const xpForThisLevel = Math.floor(totalXp / level) || xpToNextLevel;
  const xpEarnedThisLevel = xpForThisLevel - xpToNextLevel;
  return Math.max(0, Math.min(100, (xpEarnedThisLevel / xpForThisLevel) * 100));
}

export function XpBar({ totalXp, level, xpToNextLevel, className, compact = false }: XpBarProps) {
  const progress = computeXpProgress(totalXp, level, xpToNextLevel);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 shrink-0">
          <Star size={12} className="text-yellow-400" fill="currentColor" />
          <span className="text-xs font-bold text-yellow-400">Lv.{level}</span>
        </div>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 shrink-0">{xpToNextLevel} XP</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <Star size={14} className="text-yellow-400" fill="currentColor" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Level</p>
            <p className="text-lg font-black text-yellow-400 leading-none">{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total XP</p>
          <p className="text-sm font-bold text-slate-200">{totalXp.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{Math.round(progress)}%</span>
          <span>{xpToNextLevel.toLocaleString()} XP to Level {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
