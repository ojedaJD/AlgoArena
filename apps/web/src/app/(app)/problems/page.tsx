'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { problemsApi } from '@/lib/api-client';
import { ProblemCard } from '@/components/problems/problem-card';
import { ProblemFilters, type FilterState } from '@/components/problems/problem-filters';
import type { ProblemSummary } from '@dsa/shared';

const PAGE_SIZE = 20;

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 animate-pulse">
      <div className="w-8 h-3 bg-slate-800 rounded" />
      <div className="w-5 h-5 rounded-full bg-slate-800 shrink-0" />
      <div className="flex-1 h-4 bg-slate-800 rounded" />
      <div className="hidden sm:flex gap-1.5">
        <div className="w-16 h-5 bg-slate-800 rounded-full" />
        <div className="w-12 h-5 bg-slate-800 rounded-full" />
      </div>
      <div className="w-14 h-5 bg-slate-800 rounded-full shrink-0" />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={cn(
            'w-8 h-8 text-xs rounded-lg transition-colors',
            p === page
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: '',
    topic: '',
    tag: '',
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await problemsApi.list({
        page,
        limit: PAGE_SIZE,
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
        search: filters.search || undefined,
      }) as { items: ProblemSummary[]; total: number } | ProblemSummary[];

      if (Array.isArray(data)) {
        setProblems(data);
        setTotal(data.length);
      } else {
        setProblems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setProblems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={22} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Problems</h1>
            {!isLoading && (
              <p className="text-sm text-slate-400 mt-0.5">
                {total} problem{total !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <ProblemFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Problem list */}
        <div className="space-y-1.5">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            : problems.length > 0
              ? problems.map((problem, idx) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    index={(page - 1) * PAGE_SIZE + idx}
                  />
                ))
              : (
                <div className="text-center py-16 text-slate-500">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No problems found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
        </div>

        {/* Pagination */}
        {!isLoading && (
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        )}
      </div>
    </div>
  );
}
