import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds % 60}s`;
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function formatRelativeTime(date: string) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getDifficultyColor(difficulty: string) {
  const d = difficulty.toUpperCase();
  if (d === 'EASY') return 'text-emerald-400';
  if (d === 'MEDIUM') return 'text-amber-400';
  if (d === 'HARD') return 'text-red-400';
  return 'text-slate-400';
}

export function getVerdictColor(verdict: string) {
  if (verdict === 'ACCEPTED') return 'text-emerald-400';
  if (verdict === 'WRONG_ANSWER') return 'text-red-400';
  if (verdict.includes('LIMIT')) return 'text-amber-400';
  if (verdict.includes('ERROR')) return 'text-red-400';
  if (verdict === 'PENDING' || verdict === 'RUNNING') return 'text-blue-400';
  return 'text-slate-400';
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
