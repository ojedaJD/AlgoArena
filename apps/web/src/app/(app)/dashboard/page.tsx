import {
  Flame,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  Swords,
  ArrowRight,
  Code2,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate, getDifficultyColor, getVerdictColor } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, DifficultyBadge } from '@/components/ui/badge';

// ─────────────────────────────────────────────
// Mock data (replace with real API calls)
// ─────────────────────────────────────────────

const MOCK_RECENT_SUBMISSIONS = [
  { id: '1', problemTitle: 'Two Sum', slug: 'two-sum', difficulty: 'easy' as const, verdict: 'ACCEPTED', language: 'Python', timeMs: 42, submittedAt: '2026-04-01T14:20:00Z' },
  { id: '2', problemTitle: 'Longest Palindrome', slug: 'longest-palindrome', difficulty: 'medium' as const, verdict: 'WRONG_ANSWER', language: 'C++', timeMs: 0, submittedAt: '2026-04-01T11:05:00Z' },
  { id: '3', problemTitle: 'Binary Tree Inorder', slug: 'binary-tree-inorder-traversal', difficulty: 'easy' as const, verdict: 'ACCEPTED', language: 'Java', timeMs: 1, submittedAt: '2026-03-31T20:40:00Z' },
  { id: '4', problemTitle: 'Merge K Sorted Lists', slug: 'merge-k-sorted-lists', difficulty: 'hard' as const, verdict: 'TIME_LIMIT_EXCEEDED', language: 'Python', timeMs: 0, submittedAt: '2026-03-30T09:15:00Z' },
  { id: '5', problemTitle: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'easy' as const, verdict: 'ACCEPTED', language: 'TypeScript', timeMs: 56, submittedAt: '2026-03-29T16:33:00Z' },
];

const MOCK_RECOMMENDED = [
  { slug: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'medium' as const, topic: 'Two Pointers', acceptance: 54 },
  { slug: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'easy' as const, topic: 'Dynamic Programming', acceptance: 72 },
  { slug: 'word-search', title: 'Word Search', difficulty: 'medium' as const, topic: 'Backtracking', acceptance: 41 },
];

const MOCK_STATS = {
  totalSolved: 127,
  streak: 8,
  xp: 3420,
  xpToNextLevel: 4000,
  level: 7,
  easyCount: 68,
  mediumCount: 48,
  hardCount: 11,
  acceptanceRate: 74,
  matchesWon: 23,
  matchesPlayed: 31,
};

// ─────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const displayName = 'Coder';

  const xpPercent = Math.round((MOCK_STATS.xp / MOCK_STATS.xpToNextLevel) * 100);
  const winRate = Math.round((MOCK_STATS.matchesWon / MOCK_STATS.matchesPlayed) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Welcome back,{' '}
            <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Flame size={18} className="text-orange-500" />
            <span className="font-bold text-sm">{MOCK_STATS.streak} day streak</span>
          </div>

          <Link
            href="/compete"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-glow-blue"
          >
            <Swords size={16} />
            Compete
          </Link>
        </div>
      </div>

      {/* ── XP Progress Bar ── */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star size={18} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Level {MOCK_STATS.level}</p>
              <p className="text-xs text-slate-500">Algorithm Apprentice</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-yellow-400">
              {MOCK_STATS.xp.toLocaleString()} XP
            </p>
            <p className="text-xs text-slate-500">
              {(MOCK_STATS.xpToNextLevel - MOCK_STATS.xp).toLocaleString()} to next level
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[11px] text-slate-600">{xpPercent}%</p>
      </Card>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          label="Problems Solved"
          value={MOCK_STATS.totalSolved}
          sub={`Easy ${MOCK_STATS.easyCount} · Med ${MOCK_STATS.mediumCount} · Hard ${MOCK_STATS.hardCount}`}
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Acceptance Rate"
          value={`${MOCK_STATS.acceptanceRate}%`}
          sub="All submissions"
        />
        <StatCard
          icon={<Swords size={20} className="text-purple-400" />}
          iconBg="bg-purple-500/10"
          label="Match Win Rate"
          value={`${winRate}%`}
          sub={`${MOCK_STATS.matchesWon}W / ${MOCK_STATS.matchesPlayed - MOCK_STATS.matchesWon}L`}
        />
        <StatCard
          icon={<Zap size={20} className="text-yellow-400" />}
          iconBg="bg-yellow-500/10"
          label="Total XP"
          value={MOCK_STATS.xp.toLocaleString()}
          sub={`Lv. ${MOCK_STATS.level} — Apprentice`}
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <Card noPadding>
            <CardHeader className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} className="text-slate-500" />
                  Recent Submissions
                </CardTitle>
                <Link
                  href="/submissions"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Problem</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Verdict</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Lang</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {MOCK_RECENT_SUBMISSIONS.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-800/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/problems/${sub.slug}`}
                              className="font-medium text-slate-200 hover:text-blue-400 transition-colors"
                            >
                              {sub.problemTitle}
                            </Link>
                            <DifficultyBadge difficulty={sub.difficulty} size="sm" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className={cn('text-xs font-medium', getVerdictColor(sub.verdict))}>
                            {sub.verdict === 'ACCEPTED' ? '✓ Accepted' : sub.verdict.replace(/_/g, ' ')}
                          </span>
                          {sub.verdict === 'ACCEPTED' && sub.timeMs > 0 && (
                            <span className="ml-2 text-xs text-slate-600">{sub.timeMs}ms</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-slate-500 font-mono">{sub.language}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="text-xs text-slate-600">{formatDate(sub.submittedAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Recommended Problems */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen size={17} className="text-blue-400" />
                Recommended
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {MOCK_RECOMMENDED.map((p) => (
                <Link
                  key={p.slug}
                  href={`/problems/${p.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{p.topic}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={cn('text-xs', getDifficultyColor(p.difficulty))}>
                      {p.difficulty}
                    </span>
                    <ArrowRight size={13} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-150" />
                  </div>
                </Link>
              ))}
              <Link
                href="/problems"
                className="flex items-center justify-center gap-1.5 pt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Browse all problems <ArrowRight size={12} />
              </Link>
            </CardContent>
          </Card>

          {/* Rating Chart Placeholder */}
          <Card>
            <CardHeader bordered>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 size={17} className="text-emerald-400" />
                Rating History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Mock sparkline */}
              <div className="h-24 flex items-end gap-1">
                {[40, 55, 48, 62, 70, 65, 78, 85, 80, 90, 88, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className={cn(
                        'rounded-t-sm transition-all duration-500',
                        i === 11
                          ? 'bg-blue-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      )}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Current Rating</p>
                  <p className="text-xl font-bold text-slate-100">1,247</p>
                </div>
                <Badge variant="success" dot>
                  +42 this week
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className={cn('inline-flex items-center justify-center size-10 rounded-xl mb-3', iconBg)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
      <p className="text-[11px] text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

import type React from 'react';
