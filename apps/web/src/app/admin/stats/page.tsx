'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

interface PlatformStats {
  totalUsers: number;
  activeUsersToday: number;
  totalProblems: number;
  totalSubmissions: number;
  acceptRate: number;
  avgSolveTimeMs: number;
  submissionsToday: number;
  newUsersThisWeek: number;
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 animate-pulse">
      <div className="size-10 rounded-xl bg-slate-800 mb-3" />
      <div className="h-6 bg-slate-800 rounded w-16 mb-1" />
      <div className="h-3 bg-slate-800 rounded w-24" />
    </div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get<PlatformStats>('/admin/stats');
        setStats(data);
      } catch {
        // Endpoint may not exist yet; show placeholders
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fmt = (n: number | undefined) => (n != null ? n.toLocaleString() : '--');
  const pct = (n: number | undefined) => (n != null ? `${(n * 100).toFixed(1)}%` : '--');
  const ms = (n: number | undefined) =>
    n != null ? (n >= 60_000 ? `${(n / 60_000).toFixed(1)} min` : `${(n / 1000).toFixed(1)}s`) : '--';

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <BarChart2 size={22} className="text-blue-400" />
          Platform Stats
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Analytics and metrics for the platform.
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={<Users size={20} className="text-blue-400" />}
              iconBg="bg-blue-500/10"
              label="Total Users"
              value={fmt(stats?.totalUsers)}
              sub={`${fmt(stats?.newUsersThisWeek)} new this week`}
            />
            <StatCard
              icon={<Users size={20} className="text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              label="Active Today"
              value={fmt(stats?.activeUsersToday)}
              sub="Unique users today"
            />
            <StatCard
              icon={<BookOpen size={20} className="text-purple-400" />}
              iconBg="bg-purple-500/10"
              label="Problems"
              value={fmt(stats?.totalProblems)}
              sub="In the problem bank"
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-amber-400" />}
              iconBg="bg-amber-500/10"
              label="Submissions"
              value={fmt(stats?.totalSubmissions)}
              sub={`${fmt(stats?.submissionsToday)} today`}
            />
          </>
        )}
      </div>

      {/* Detailed metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader bordered>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 size={17} className="text-emerald-400" />
              Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-20 mb-2" />
                <div className="h-2 bg-slate-800 rounded w-full" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-100">{pct(stats?.acceptRate)}</p>
                <p className="text-xs text-slate-500 mt-1">of all submissions accepted</p>
                <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: stats?.acceptRate != null ? `${stats.acceptRate * 100}%` : '0%' }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader bordered>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={17} className="text-blue-400" />
              Avg Solve Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-24 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-40" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-100">{ms(stats?.avgSolveTimeMs)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Average time to first accepted submission
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future charts */}
      <Card>
        <CardHeader bordered>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 size={17} className="text-slate-500" />
            Submission Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <BarChart2 size={36} className="mb-3 text-slate-700" />
            <p className="text-sm font-medium text-slate-400">Charts coming soon</p>
            <p className="text-xs text-slate-600 mt-1">
              Submission volume, difficulty distribution, and user growth will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
