'use client';

import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FIRE_SIZES = { sm: 14, md: 18, lg: 24 };
const TEXT_CLASSES = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

function FireIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 23C8.686 23 6 20.314 6 17c0-1.874.87-3.617 2.333-4.764.403-.31.97-.06.97.45v1.014c0 .574.456 1.05 1.03 1.05.32 0 .622-.15.82-.41.59-.78.847-1.73.747-2.71 1.77 1.01 2.9 2.91 2.9 5.014 0 .456-.052.903-.152 1.334C15.48 17.085 16 15.6 16 14c0-2.188-.89-4.28-2.44-5.81a.76.76 0 0 0-1.28.45c-.12.89-.54 1.71-1.18 2.32C10.3 11.78 10 12.88 10 14c0-.37-.04-.73-.12-1.08C9.01 11.2 7 9.73 7 8c0-1.56.82-3.14 2.14-4.41.35-.34.9-.19 1.05.26.27.83.89 1.52 1.7 1.87.26.11.56.05.76-.14C13.65 4.58 14 3.3 14 2c3.31 1.53 5 4.5 5 8 0 3.07-1.43 5.82-3.71 7.64.47-.94.71-1.99.71-3.04 0-2.1-1-4.1-2.71-5.37-.48-.36-1.17-.07-1.27.52-.12.71-.48 1.36-.96 1.86-.15.15-.24.35-.24.56 0 1.76 1.18 3.25 2.88 3.67.1.02.2.04.3.04C14.62 17.88 15 18.89 15 20c0 1.66-1.34 3-3 3z" />
    </svg>
  );
}

export function StreakBadge({ currentStreak, longestStreak, className, size = 'md' }: StreakBadgeProps) {
  const isActive = currentStreak > 0;
  const fireSize = FIRE_SIZES[size];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-xl border',
        isActive
          ? 'bg-orange-500/15 border-orange-500/30'
          : 'bg-slate-800 border-slate-700'
      )}>
        <FireIcon
          size={fireSize}
          className={cn(
            'transition-colors',
            isActive ? 'text-orange-400' : 'text-slate-600'
          )}
        />
        <span className={cn(
          'font-black tabular-nums',
          TEXT_CLASSES[size],
          isActive ? 'text-orange-300' : 'text-slate-500'
        )}>
          {currentStreak}
        </span>
        <span className={cn(
          'text-xs font-medium',
          isActive ? 'text-orange-400/70' : 'text-slate-600'
        )}>
          {currentStreak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {longestStreak !== undefined && (
        <p className="text-[11px] text-slate-600">
          Best: <span className="text-slate-500 font-medium">{longestStreak} days</span>
        </p>
      )}
    </div>
  );
}
