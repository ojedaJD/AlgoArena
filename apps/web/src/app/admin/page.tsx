'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  BarChart2,
  ArrowRight,
  Loader2,
  Map,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalProblems: number;
  totalTopics: number;
  totalUsers: number;
  totalSubmissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get<DashboardStats>('/admin/stats/overview');
        setStats(data);
      } catch {
        // Fall back to placeholder values if endpoint doesn't exist yet
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickLinks = [
    { href: '/admin/problems', label: 'Manage Problems', icon: BookOpen, desc: 'Add, edit, or remove coding problems' },
    { href: '/admin/topics', label: 'Manage Topics', icon: GraduationCap, desc: 'Organize topics and categories' },
    { href: '/admin/curriculum', label: 'Curriculum Map', icon: Map, desc: 'Design the learning path' },
    { href: '/admin/stats', label: 'View Stats', icon: BarChart2, desc: 'Platform analytics and metrics' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <LayoutDashboard size={22} className="text-blue-400" />
          Admin Dashboard
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Welcome back. Here is an overview of the platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 animate-pulse">
              <div className="size-10 rounded-xl bg-slate-800 mb-3" />
              <div className="h-6 bg-slate-800 rounded w-16 mb-1" />
              <div className="h-3 bg-slate-800 rounded w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={<BookOpen size={20} className="text-blue-400" />}
              iconBg="bg-blue-500/10"
              label="Total Problems"
              value={stats?.totalProblems ?? '--'}
              sub="Across all difficulties"
            />
            <StatCard
              icon={<GraduationCap size={20} className="text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              label="Topics"
              value={stats?.totalTopics ?? '--'}
              sub="Categories available"
            />
            <StatCard
              icon={<Users size={20} className="text-purple-400" />}
              iconBg="bg-purple-500/10"
              label="Users"
              value={stats?.totalUsers ?? '--'}
              sub="Registered accounts"
            />
            <StatCard
              icon={<BarChart2 size={20} className="text-amber-400" />}
              iconBg="bg-amber-500/10"
              label="Submissions"
              value={stats?.totalSubmissions ?? '--'}
              sub="Total code submissions"
            />
          </>
        )}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader bordered>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="shrink-0 flex items-center justify-center size-9 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                  <Icon size={16} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 truncate">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
