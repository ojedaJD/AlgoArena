'use client';

import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Difficulty } from '@dsa/shared';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: Difficulty.EASY, label: 'Easy' },
  { value: Difficulty.MEDIUM, label: 'Medium' },
  { value: Difficulty.HARD, label: 'Hard' },
];

const TOPIC_OPTIONS = [
  { value: '', label: 'All Topics' },
  { value: 'arrays', label: 'Arrays' },
  { value: 'strings', label: 'Strings' },
  { value: 'linked-lists', label: 'Linked Lists' },
  { value: 'trees', label: 'Trees' },
  { value: 'graphs', label: 'Graphs' },
  { value: 'dynamic-programming', label: 'Dynamic Programming' },
  { value: 'sorting', label: 'Sorting' },
  { value: 'binary-search', label: 'Binary Search' },
  { value: 'hash-tables', label: 'Hash Tables' },
  { value: 'stacks-queues', label: 'Stacks & Queues' },
  { value: 'recursion', label: 'Recursion' },
  { value: 'greedy', label: 'Greedy' },
];

export interface FilterState {
  search: string;
  difficulty: string;
  topic: string;
  tag: string;
}

interface ProblemFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none bg-slate-800 border border-slate-700 rounded-lg',
          'text-sm text-slate-300 px-3 py-2 pr-8',
          'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
          'hover:border-slate-600 transition-colors cursor-pointer',
          value && 'border-blue-500/50 text-slate-200'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

export function ProblemFilters({ filters, onChange }: ProblemFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.difficulty || filters.topic || filters.tag;

  const update = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({ search: '', difficulty: '', topic: '', tag: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Text search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search problems..."
          className={cn(
            'w-full bg-slate-800 border border-slate-700 rounded-lg',
            'text-sm text-slate-300 pl-9 pr-4 py-2',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            'hover:border-slate-600 transition-colors placeholder:text-slate-600'
          )}
        />
        {filters.search && (
          <button
            onClick={() => update('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Difficulty dropdown */}
      <SelectFilter
        value={filters.difficulty}
        onChange={(v) => update('difficulty', v)}
        options={DIFFICULTY_OPTIONS}
      />

      {/* Topic dropdown */}
      <SelectFilter
        value={filters.topic}
        onChange={(v) => update('topic', v)}
        options={TOPIC_OPTIONS}
      />

      {/* Tag search */}
      <div className="relative">
        <input
          type="text"
          value={filters.tag}
          onChange={(e) => update('tag', e.target.value)}
          placeholder="Filter by tag..."
          className={cn(
            'bg-slate-800 border border-slate-700 rounded-lg',
            'text-sm text-slate-300 px-3 py-2 w-36',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            'hover:border-slate-600 transition-colors placeholder:text-slate-600'
          )}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium',
            'text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600',
            'transition-colors'
          )}
        >
          <X size={12} />
          Clear filters
        </button>
      )}
    </div>
  );
}
