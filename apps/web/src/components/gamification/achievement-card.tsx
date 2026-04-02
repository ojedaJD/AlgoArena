'use client';

import { Lock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Achievement, UserAchievement } from '@dsa/shared';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  className?: string;
}

// Map achievement slug patterns to emoji icons as fallback
function getAchievementEmoji(slug: string): string {
  if (slug.includes('first')) return '🎯';
  if (slug.includes('streak')) return '🔥';
  if (slug.includes('win')) return '🏆';
  if (slug.includes('solve')) return '✅';
  if (slug.includes('speed')) return '⚡';
  if (slug.includes('hard')) return '💎';
  if (slug.includes('social') || slug.includes('friend')) return '🤝';
  return '⭐';
}

export function AchievementCard({ achievement, userAchievement, className }: AchievementCardProps) {
  const isUnlocked = Boolean(userAchievement);

  return (
    <div className={cn(
      'relative flex items-start gap-4 p-4 rounded-xl border transition-all',
      isUnlocked
        ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
        : 'bg-slate-950 border-slate-800 opacity-60',
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border',
        isUnlocked
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-slate-800 border-slate-700 grayscale'
      )}>
        {achievement.iconUrl ? (
          <img
            src={achievement.iconUrl}
            alt={achievement.title}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <span>{getAchievementEmoji(achievement.slug)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className={cn(
            'text-sm font-semibold',
            isUnlocked ? 'text-slate-200' : 'text-slate-500'
          )}>
            {achievement.title}
          </h3>
          {isUnlocked && (
            <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-yellow-400" />
          )}
        </div>
        <p className={cn(
          'text-xs mt-0.5',
          isUnlocked ? 'text-slate-400' : 'text-slate-600'
        )}>
          {achievement.description}
        </p>
        {isUnlocked && userAchievement && (
          <p className="text-[11px] text-slate-600 mt-1.5">
            Unlocked {formatDate(userAchievement.unlockedAt)}
          </p>
        )}
      </div>

      {/* Lock icon overlay for locked achievements */}
      {!isUnlocked && (
        <Lock size={14} className="text-slate-600 shrink-0 mt-0.5" />
      )}
    </div>
  );
}
