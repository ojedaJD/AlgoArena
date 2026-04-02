import { cn } from '@/lib/utils';
import type React from 'react';

const variants = {
  default: 'bg-slate-700 text-slate-200',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  danger: 'bg-red-900/50 text-red-400 border border-red-800',
  outline: 'border border-slate-600 text-slate-300',
  primary: 'bg-blue-900/50 text-blue-400 border border-blue-800',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', size = 'md', dot, className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', variants[variant], sizes[size], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

interface DifficultyBadgeProps {
  difficulty: string;
  size?: keyof typeof sizes;
}

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const upper = difficulty.toUpperCase();
  const v = upper === 'EASY' ? 'success' : upper === 'MEDIUM' ? 'warning' : 'danger';
  return <Badge variant={v} size={size}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()}</Badge>;
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict === 'ACCEPTED' ? 'success' : verdict.includes('ERROR') || verdict === 'WRONG_ANSWER' ? 'danger' : 'warning';
  const label = verdict === 'ACCEPTED' ? 'Accepted' : verdict.replace(/_/g, ' ');
  return <Badge variant={v} size="sm">{label}</Badge>;
}
