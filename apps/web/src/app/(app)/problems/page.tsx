'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
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

export default function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]); // stack for prev pages
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: '',
    topic: '',
    tag: '',
  });

  const fetchProblems = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    try {
      const data = await problemsApi.list({
        cursor,
        limit: PAGE_SIZE,
        difficulty: filters.difficulty || undefined,
        topic: filters.topic || undefined,
        search: filters.search || undefined,
      });

      // Normalize API shape → ProblemSummary (flatten nested tag/topic objects)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data.data ?? []).map((p: any) => ({
        ...p,
        tags: Array.isArray(p.tags)
          ? p.tags.map((t: unknown) => (typeof t === 'object' && t !== null && 'tag' in t ? (t as {tag:string}).tag : t))
          : [],
        topicIds: Array.isArray(p.topics)
          ? p.topics.map((t: unknown) => {
              if (typeof t === 'object' && t !== null && 'topic' in t) {
                const inner = (t as {topic:{id:string}}).topic;
                return inner?.id ?? '';
              }
              return t;
            })
          : [],
      }));
      setProblems(normalized as unknown as ProblemSummary[]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setProblems([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProblems(cursors[pageIndex]);
  }, [fetchProblems, pageIndex, cursors]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCursors([undefined]);
    setPageIndex(0);
  };

  const handleNext = () => {
    if (nextCursor && hasMore) {
      setCursors((prev) => {
        const next = [...prev];
        if (!next[pageIndex + 1]) next[pageIndex + 1] = nextCursor;
        return next;
      });
      setPageIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (pageIndex > 0) {
      setPageIndex((i) => i - 1);
    }
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
                Page {pageIndex + 1} &middot; {problems.length} shown
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
                    index={pageIndex * PAGE_SIZE + idx}
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
        {!isLoading && (problems.length > 0 || pageIndex > 0) && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={handlePrev}
              disabled={pageIndex === 0}
              className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {pageIndex + 1}</span>
            <button
              onClick={handleNext}
              disabled={!hasMore}
              className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
