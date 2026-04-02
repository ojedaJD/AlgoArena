'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, Loader2, History } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Submission } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string; short: string }> = {
  [SubmissionStatus.ACCEPTED]: { label: 'Accepted', short: 'AC', className: 'text-emerald-400' },
  [SubmissionStatus.WRONG_ANSWER]: { label: 'Wrong Answer', short: 'WA', className: 'text-red-400' },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: { label: 'Time Limit Exceeded', short: 'TLE', className: 'text-yellow-400' },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: { label: 'Memory Limit Exceeded', short: 'MLE', className: 'text-orange-400' },
  [SubmissionStatus.RUNTIME_ERROR]: { label: 'Runtime Error', short: 'RE', className: 'text-red-400' },
  [SubmissionStatus.COMPILATION_ERROR]: { label: 'Compilation Error', short: 'CE', className: 'text-purple-400' },
  [SubmissionStatus.PENDING]: { label: 'Pending', short: '...', className: 'text-slate-400' },
  [SubmissionStatus.RUNNING]: { label: 'Running', short: '...', className: 'text-blue-400' },
};

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3',
  javascript: 'JavaScript',
  cpp: 'C++17',
  java: 'Java 21',
};

interface SubmissionWithSlug extends Submission {
  problemSlug?: string;
  problemTitle?: string;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-800 rounded" style={{ width: `${50 + (i * 12) % 35}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithSlug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get<SubmissionWithSlug[]>('/submissions/me', { params: { page, limit: 20 } })
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <History size={22} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Submissions</h1>
            <p className="text-sm text-slate-400 mt-0.5">All your submission history</p>
          </div>
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
                  Problem
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
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : submissions.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-slate-500">
                        <History size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No submissions yet. Start solving problems!</p>
                      </td>
                    </tr>
                  )
                  : submissions.map((sub) => {
                    const cfg = STATUS_CONFIG[sub.status];
                    return (
                      <tr
                        key={sub.id}
                        className="bg-slate-950 hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={cn('flex items-center gap-1.5 font-medium text-xs', cfg.className)}>
                            {sub.status === SubmissionStatus.ACCEPTED ? (
                              <CheckCircle2 size={13} />
                            ) : sub.status === SubmissionStatus.RUNNING || sub.status === SubmissionStatus.PENDING ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <XCircle size={13} />
                            )}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {sub.problemSlug ? (
                            <Link
                              href={`/problems/${sub.problemSlug}`}
                              className="text-slate-300 hover:text-blue-400 hover:underline transition-colors"
                            >
                              {sub.problemTitle ?? sub.problemSlug}
                            </Link>
                          ) : (
                            <span className="text-slate-500 text-xs">Problem #{sub.problemId.slice(0, 8)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {LANGUAGE_LABELS[sub.language] ?? sub.language}
                        </td>
                        <td className="px-4 py-3 text-slate-400 tabular-nums">
                          {sub.runtimeMs !== null ? `${sub.runtimeMs}ms` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 tabular-nums">
                          {sub.memoryKb !== null ? `${(sub.memoryKb / 1024).toFixed(1)}MB` : '—'}
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

        {/* Load more */}
        {!isLoading && submissions.length === 20 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
