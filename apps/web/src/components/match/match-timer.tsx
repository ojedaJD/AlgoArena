'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MatchTimerProps {
  timeRemainingMs: number;
  totalMs?: number;
  className?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function MatchTimer({ timeRemainingMs, totalMs, className }: MatchTimerProps) {
  const [display, setDisplay] = useState(timeRemainingMs);

  // Sync when prop changes (driven by server)
  useEffect(() => {
    setDisplay(timeRemainingMs);
  }, [timeRemainingMs]);

  // Local countdown interpolation between server ticks
  useEffect(() => {
    if (display <= 0) return;
    const interval = setInterval(() => {
      setDisplay((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemainingMs]); // only restart on server update

  const seconds = Math.floor(display / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const ratio = totalMs ? display / totalMs : 1;

  const colorClass =
    display <= 30_000
      ? 'text-red-400'
      : display <= 120_000
        ? 'text-yellow-400'
        : 'text-emerald-400';

  const urgentPulse = display <= 30_000 && display > 0;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'font-mono text-4xl font-bold tabular-nums tracking-widest transition-colors duration-500',
          colorClass,
          urgentPulse && 'animate-pulse'
        )}
      >
        {pad(minutes)}:{pad(secs)}
      </div>
      {totalMs && (
        <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              ratio > 0.5 ? 'bg-emerald-500' : ratio > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
