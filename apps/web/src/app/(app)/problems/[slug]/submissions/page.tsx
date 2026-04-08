'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { problemsApi } from '@/lib/api-client';
import type { Submission } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; icon: React.ReactNode; className: string }> = {
  [SubmissionStatus.ACCEPTED]: {
    label: 'Accepted',
    icon: <CheckCircle2 size={14} />,
    className: 'text-emerald-400',
  },
  [SubmissionStatus.WRONG_ANSWER]: {
    label: 'Wrong Answer',
    icon: <XCircle size={14} />,
    className: 'text-red-400',
  },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: {
    label: 'TLE',
    icon: <Clock size={14} />,
    className: 'text-yellow-400',
  },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: {
    label: 'MLE',
    icon: <Clock size={14} />,
    className: 'text-orange-400',
  },
  [SubmissionStatus.RUNTIME_ERROR]: {
    label: 'Runtime Error',
    icon: <XCircle size={14} />,
    className: 'text-red-400',
  },
  [SubmissionStatus.COMPILATION_ERROR]: {
    label: 'Compile Error',
    icon: <XCircle size={14} />,
    className: 'text-purple-400',
  },
  [SubmissionStatus.PENDING]: {
    label: 'Pending',
    icon: <Loader2 size={14} className="animate-spin" />,
    className: 'text-slate-400',
  },
  [SubmissionStatus.RUNNING]: {
    label: 'Running',
    icon: <Loader2 size={14} className="animate-spin" />,
    className: 'text-blue-400',
  },
};

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3',
  javascript: 'JavaScript',
  cpp: 'C++17',
  java: 'Java 21',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-800 rounded" style={{ width: `${40 + (i * 15) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function SubmissionsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    problemsApi
      .getSubmissions(slug)
      .then((data) => setSubmissions((data.items ?? data) as Submission[]))
      .catch(() => setSubmissions([]))
      .finally(() => setIsLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/problems/${slug}`}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Problem
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-xl font-bold text-slate-100">My Submissions</h1>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Language
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Runtime
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Memory
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Cases
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : submissions.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No submissions yet. Solve the problem!
                      </td>
                    </tr>
                  )
                  : submissions.map((sub) => {
                    const statusCfg = STATUS_CONFIG[sub.status];
                    return (
                      <tr
                        key={sub.id}
                        className="bg-slate-950 hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={cn('flex items-center gap-1.5 font-medium', statusCfg.className)}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {LANGUAGE_LABELS[sub.language] ?? sub.language}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {sub.runtimeMs !== null ? `${sub.runtimeMs}ms` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {sub.memoryKb !== null
                            ? `${(sub.memoryKb / 1024).toFixed(1)}MB`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <span className={cn(
                            sub.passedCases === sub.totalCases ? 'text-emerald-400' : 'text-slate-400'
                          )}>
                            {sub.passedCases}/{sub.totalCases}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {formatRelativeTime(sub.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
