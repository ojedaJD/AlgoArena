'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Problem } from '@dsa/shared';
import { Difficulty } from '@dsa/shared';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  [Difficulty.EASY]: 'text-emerald-400',
  [Difficulty.MEDIUM]: 'text-yellow-400',
  [Difficulty.HARD]: 'text-red-400',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-800 rounded" style={{ width: `${50 + (i * 11) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Problem[]>('/admin/problems', {
        params: { limit: 100 },
      });
      setProblems(data);
    } catch {
      setProblems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProblems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this problem? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/admin/problems/${id}`);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete problem');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim()
    ? problems.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.includes(search.toLowerCase())
      )
    : problems;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Problems</h1>
          <p className="text-sm text-slate-400 mt-0.5">{problems.length} total</p>
        </div>
        <Link
          href="/admin/problems/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Problem
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800">
              {['Title', 'Slug', 'Difficulty', 'Published', 'Updated', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.map((problem) => (
                  <tr key={problem.id} className="bg-slate-950 hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/problems/${problem.slug}`}
                        target="_blank"
                        className="text-slate-200 hover:text-blue-400 font-medium hover:underline transition-colors"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{problem.slug}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold', DIFFICULTY_COLORS[problem.difficulty])}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {problem.isPublished ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <XCircle size={15} className="text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(problem.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/problems/${problem.slug}/edit`}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Pencil size={13} />
                        </Link>
                        <button
                          onClick={() => handleDelete(problem.id)}
                          disabled={deletingId === problem.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                        >
                          {deletingId === problem.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
