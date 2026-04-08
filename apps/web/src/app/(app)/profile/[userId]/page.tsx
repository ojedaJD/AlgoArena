'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import {
  Star,
  Trophy,
  Swords,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  UserPlus,
  UserCheck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PublicUserProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  rating: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  streak: number;
  wins: number;
  losses: number;
  draws: number;
  totalSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  joinedAt: string;
  isFriend?: boolean;
  friendRequestPending?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface Submission {
  id: string;
  problemTitle: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  verdict: string;
  language: string;
  submittedAt: string;
}

interface MatchHistoryEntry {
  id: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  ratingDelta: number;
  endedAt: string;
}

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Blood', description: 'Submit your first accepted solution', icon: '⚡', unlockedAt: '2026-01-10T10:00:00Z' },
  { id: '2', title: 'On Fire', description: 'Maintain a 7-day streak', icon: '🔥', unlockedAt: '2026-02-14T08:00:00Z' },
  { id: '3', title: 'Gladiator', description: 'Win 10 competitive matches', icon: '⚔️', unlockedAt: '2026-03-01T12:00:00Z' },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: '1', problemTitle: 'Two Sum', slug: 'two-sum', difficulty: 'easy', verdict: 'ACCEPTED', language: 'Python', submittedAt: '2026-04-01T14:20:00Z' },
  { id: '2', problemTitle: 'Longest Palindrome', slug: 'longest-palindrome', difficulty: 'medium', verdict: 'ACCEPTED', language: 'C++', submittedAt: '2026-04-01T11:05:00Z' },
  { id: '3', problemTitle: 'Binary Tree Inorder', slug: 'binary-tree-inorder-traversal', difficulty: 'easy', verdict: 'ACCEPTED', language: 'Java', submittedAt: '2026-03-31T20:40:00Z' },
  { id: '4', problemTitle: 'Merge K Sorted Lists', slug: 'merge-k-sorted-lists', difficulty: 'hard', verdict: 'TIME_LIMIT_EXCEEDED', language: 'Python', submittedAt: '2026-03-30T09:15:00Z' },
];

const MOCK_MATCH_HISTORY: MatchHistoryEntry[] = [
  { id: '1', opponentName: 'AlgoKing', result: 'win', ratingDelta: 18, endedAt: '2026-04-01T15:00:00Z' },
  { id: '2', opponentName: 'CodeNinja99', result: 'loss', ratingDelta: -12, endedAt: '2026-03-31T10:30:00Z' },
  { id: '3', opponentName: 'ByteWizard', result: 'win', ratingDelta: 22, endedAt: '2026-03-30T18:15:00Z' },
  { id: '4', opponentName: 'StackOverflow', result: 'draw', ratingDelta: 0, endedAt: '2026-03-28T14:00:00Z' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getVerdictColor(verdict: string) {
  if (verdict === 'ACCEPTED') return 'text-emerald-400';
  if (verdict === 'WRONG_ANSWER') return 'text-red-400';
  if (verdict === 'TIME_LIMIT_EXCEEDED') return 'text-amber-400';
  return 'text-slate-400';
}

function getDifficultyColor(d: string) {
  if (d === 'easy') return 'text-emerald-400';
  if (d === 'medium') return 'text-amber-400';
  return 'text-red-400';
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

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

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [addingFriend, setAddingFriend] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<PublicUserProfile>(`/v1/users/${userId}`)
      .then((data) => {
        setProfile(data);
        setFriendStatus(data.isFriend ? 'friends' : data.friendRequestPending ? 'pending' : 'none');
      })
      .catch((err) => {
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setNotFound(true);
        } else {
          // Fall back to mock
          setProfile({
            id: userId,
            displayName: 'AlgoKing',
            bio: 'Competitive programmer. Top 100 globally. Loves graph algorithms.',
            rating: 1842,
            xp: 12400,
            level: 18,
            xpToNextLevel: 14000,
            streak: 32,
            wins: 87,
            losses: 21,
            draws: 5,
            totalSolved: 312,
            easyCount: 120,
            mediumCount: 155,
            hardCount: 37,
            joinedAt: '2024-06-01T00:00:00Z',
            isFriend: false,
            friendRequestPending: false,
          });
          setFriendStatus('none');
        }
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleAddFriend = async () => {
    if (addingFriend) return;
    setAddingFriend(true);
    try {
      await api.post(`/v1/friends/request`, { targetUserId: userId });
      setFriendStatus('pending');
    } catch {
      // Optimistically update for demo
      setFriendStatus('pending');
    } finally {
      setAddingFriend(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-6xl mb-4">👤</p>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">User Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">This profile doesn't exist or has been removed.</p>
        <Link href="/leaderboard">
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} className="mr-2" />
            Browse Leaderboard
          </Button>
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const xpPercent = Math.round((profile.xp / profile.xpToNextLevel) * 100);
  const totalMatches = profile.wins + profile.losses + profile.draws;
  const winRate = totalMatches > 0 ? Math.round((profile.wins / totalMatches) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Back link */}
      <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ArrowLeft size={14} />
        Leaderboard
      </Link>

      {/* ── Profile Header ── */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="size-24 rounded-2xl overflow-hidden ring-2 ring-slate-700">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(profile.displayName)}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">{profile.displayName}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Member since {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Friend button */}
                {friendStatus === 'friends' ? (
                  <Button variant="outline" size="sm" disabled>
                    <UserCheck size={14} className="mr-2 text-emerald-400" />
                    Friends
                  </Button>
                ) : friendStatus === 'pending' ? (
                  <Button variant="outline" size="sm" disabled>
                    <Clock size={14} className="mr-2 text-slate-400" />
                    Request Sent
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={addingFriend}
                    onClick={handleAddFriend}
                  >
                    <UserPlus size={14} className="mr-2" />
                    Add Friend
                  </Button>
                )}
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{profile.bio}</p>
              )}

              {/* Badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <Flame size={13} />
                  {profile.streak} day streak
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <TrendingUp size={13} />
                  Rating {profile.rating.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold">
                  <Star size={13} />
                  Level {profile.level}
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">XP Progress — Level {profile.level}</span>
              <span className="text-xs font-bold text-yellow-400">
                {profile.xp.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          label="Problems Solved"
          value={profile.totalSolved}
          sub={`Easy ${profile.easyCount} · Med ${profile.mediumCount} · Hard ${profile.hardCount}`}
        />
        <StatCard
          icon={<Swords size={20} className="text-purple-400" />}
          iconBg="bg-purple-500/10"
          label="Match Record"
          value={`${profile.wins}W`}
          sub={`${profile.wins}W / ${profile.losses}L / ${profile.draws}D · ${winRate}% win rate`}
        />
        <StatCard
          icon={<Trophy size={20} className="text-yellow-400" />}
          iconBg="bg-yellow-500/10"
          label="Rating"
          value={profile.rating.toLocaleString()}
          sub="Competitive rating"
        />
        <StatCard
          icon={<Zap size={20} className="text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Total XP"
          value={profile.xp.toLocaleString()}
          sub={`Level ${profile.level}`}
        />
      </div>

      {/* ── Achievements ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award size={17} className="text-amber-400" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_ACHIEVEMENTS.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800"
              >
                <div className="size-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{a.description}</p>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0">{formatDate(a.unlockedAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Grid: Submissions + Match History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={16} className="text-slate-500" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {MOCK_SUBMISSIONS.map((sub) => (
              <Link
                key={sub.id}
                href={`/problems/${sub.slug}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors truncate">
                    {sub.problemTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[11px] font-medium', getDifficultyColor(sub.difficulty))}>
                      {sub.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">{sub.language}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn('text-xs font-medium', getVerdictColor(sub.verdict))}>
                    {sub.verdict === 'ACCEPTED' ? '✓' : '✗'} {sub.verdict.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(sub.submittedAt)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Match History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords size={16} className="text-slate-500" />
              Match History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {MOCK_MATCH_HISTORY.map((m) => (
              <Link
                key={m.id}
                href={`/compete/${m.id}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'size-8 rounded-full flex items-center justify-center shrink-0',
                    m.result === 'win' ? 'bg-emerald-500/20' : m.result === 'draw' ? 'bg-blue-500/20' : 'bg-red-500/20'
                  )}>
                    {m.result === 'win' ? (
                      <Trophy size={13} className="text-emerald-400" />
                    ) : m.result === 'draw' ? (
                      <Swords size={13} className="text-blue-400" />
                    ) : (
                      <ArrowRight size={13} className="text-red-400 rotate-180" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                      vs {m.opponentName}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {m.result === 'win' ? 'Victory' : m.result === 'draw' ? 'Draw' : 'Defeat'} · {formatDate(m.endedAt)}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold shrink-0',
                  m.ratingDelta > 0 ? 'text-emerald-400' : m.ratingDelta < 0 ? 'text-red-400' : 'text-slate-500'
                )}>
                  {m.ratingDelta > 0 ? '+' : ''}{m.ratingDelta}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import type React from 'react';
