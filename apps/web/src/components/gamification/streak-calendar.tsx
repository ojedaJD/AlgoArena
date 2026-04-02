'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  /** Map of ISO date string (YYYY-MM-DD) to activity count */
  activityData: Record<string, number>;
  /** Number of weeks to display (default 52) */
  weeks?: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  'bg-slate-800 border-slate-700',            // 0: empty
  'bg-emerald-900 border-emerald-800',         // 1: light
  'bg-emerald-700 border-emerald-600',         // 2: medium
  'bg-emerald-500 border-emerald-400',         // 3: high
  'bg-emerald-400 border-emerald-300',         // 4: max
];

export function StreakCalendar({ activityData, weeks = 52 }: StreakCalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Build grid: weeks × 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from `weeks` weeks ago, aligned to Sunday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weeks * 7 + 1);
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const grid: { date: string; count: number; isCurrentMonth: boolean }[][] = [];

  for (let w = 0; w < weeks; w++) {
    const week: typeof grid[0] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const iso = toIso(date);
      week.push({
        date: iso,
        count: activityData[iso] ?? 0,
        isCurrentMonth: date.getMonth() === today.getMonth(),
      });
    }
    grid.push(week);
  }

  // Compute month labels
  const monthLabels: { label: string; col: number }[] = [];
  for (let w = 0; w < weeks; w++) {
    const firstDay = grid[w]?.[0];
    if (!firstDay) continue;
    const date = new Date(firstDay.date);
    if (w === 0 || date.getDate() <= 7) {
      const month = MONTHS[date.getMonth()];
      if (monthLabels[monthLabels.length - 1]?.label !== month) {
        monthLabels.push({ label: month, col: w });
      }
    }
  }

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex text-[10px] text-slate-500 mb-1 ml-8">
        {monthLabels.map(({ label, col }, i) => (
          <span
            key={`${label}-${col}`}
            style={{ marginLeft: i === 0 ? 0 : `${(col - (monthLabels[i - 1]?.col ?? 0)) * 13 - 16}px` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day of week labels */}
        <div className="flex flex-col gap-0.5 text-[10px] text-slate-600 mr-1">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={day} className="h-[11px] leading-[11px]">
              {i % 2 === 1 ? day.slice(0, 1) : ''}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="flex gap-0.5">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map(({ date, count }) => {
                const intensity = getIntensity(count);
                return (
                  <div
                    key={date}
                    className={cn(
                      'w-[11px] h-[11px] rounded-sm border cursor-default transition-transform hover:scale-110',
                      INTENSITY_CLASSES[intensity]
                    )}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ date, count, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-800 border border-slate-600 text-[11px] text-slate-200 px-2 py-1 rounded shadow-lg"
          style={{ left: tooltip.x - 20, top: tooltip.y - 36 }}
        >
          <span className="font-semibold">{tooltip.count} submissions</span>
          <span className="text-slate-400 ml-1">on {tooltip.date}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end text-[10px] text-slate-500">
        <span>Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={cn('w-[11px] h-[11px] rounded-sm border', cls)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
