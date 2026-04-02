'use client';

import { useState } from 'react';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Problem } from '@dsa/shared';
import { Difficulty } from '@dsa/shared';

export interface ProblemFormData {
  title: string;
  slug: string;
  difficulty: Difficulty;
  statementMd: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  tags: string;
  topicIds: string;
}

interface ProblemFormProps {
  initialData?: Partial<Problem>;
  onSubmit: (data: ProblemFormData) => Promise<void>;
  submitLabel?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: Difficulty.EASY, label: 'Easy' },
  { value: Difficulty.MEDIUM, label: 'Medium' },
  { value: Difficulty.HARD, label: 'Hard' },
];

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

const INPUT_BASE = cn(
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5',
  'text-sm text-slate-300 placeholder:text-slate-600',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'hover:border-slate-600 transition-colors'
);

export function ProblemForm({ initialData, onSubmit, submitLabel = 'Save Problem' }: ProblemFormProps) {
  const [form, setForm] = useState<ProblemFormData>({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    difficulty: initialData?.difficulty ?? Difficulty.EASY,
    statementMd: initialData?.statementMd ?? '',
    timeLimitMs: initialData?.timeLimitMs ?? 2000,
    memoryLimitMb: initialData?.memoryLimitMb ?? 256,
    isPublished: initialData?.isPublished ?? false,
    tags: initialData?.tags?.join(', ') ?? '',
    topicIds: initialData?.topicIds?.join(', ') ?? '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewMd, setPreviewMd] = useState(false);

  const set = (key: keyof ProblemFormData, value: ProblemFormData[typeof key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (!initialData?.slug) {
      set('slug', autoSlug(v));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Title and slug are required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? 'Failed to save problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Two Sum"
            className={INPUT_BASE}
          />
        </FormField>
        <FormField label="Slug" required hint="URL-friendly identifier">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="two-sum"
            className={INPUT_BASE}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Difficulty" required>
          <select
            value={form.difficulty}
            onChange={(e) => set('difficulty', e.target.value as Difficulty)}
            className={cn(INPUT_BASE, 'appearance-none')}
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Time Limit (ms)">
          <input
            type="number"
            value={form.timeLimitMs}
            onChange={(e) => set('timeLimitMs', Number(e.target.value))}
            min={100}
            max={10000}
            className={INPUT_BASE}
          />
        </FormField>
        <FormField label="Memory Limit (MB)">
          <input
            type="number"
            value={form.memoryLimitMb}
            onChange={(e) => set('memoryLimitMb', Number(e.target.value))}
            min={16}
            max={1024}
            className={INPUT_BASE}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tags" hint="Comma-separated: array, hash-map, two-pointers">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="array, hash-map"
            className={INPUT_BASE}
          />
        </FormField>
        <FormField label="Topic IDs" hint="Comma-separated UUIDs">
          <input
            type="text"
            value={form.topicIds}
            onChange={(e) => set('topicIds', e.target.value)}
            placeholder="uuid1, uuid2"
            className={INPUT_BASE}
          />
        </FormField>
      </div>

      <FormField label="Problem Statement (Markdown)" required>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setPreviewMd(false)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
              !previewMd ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreviewMd(true)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
              previewMd ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Eye size={12} />
            Preview
          </button>
        </div>
        {previewMd ? (
          <div className="min-h-[300px] bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap">
            {form.statementMd || <span className="text-slate-600 italic">No content</span>}
          </div>
        ) : (
          <textarea
            value={form.statementMd}
            onChange={(e) => set('statementMd', e.target.value)}
            rows={16}
            placeholder="# Problem Statement&#10;&#10;Given an array...&#10;&#10;## Examples&#10;&#10;**Input:** nums = [2,7,11,15], target = 9&#10;**Output:** [0,1]"
            className={cn(INPUT_BASE, 'font-mono resize-y')}
          />
        )}
      </FormField>

      {/* Published toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div>
          <p className="text-sm font-medium text-slate-200">Published</p>
          <p className="text-xs text-slate-500">Visible to all users</p>
        </div>
        <button
          type="button"
          onClick={() => set('isPublished', !form.isPublished)}
          className={cn(
            'relative w-10 h-6 rounded-full transition-colors duration-200',
            form.isPublished ? 'bg-blue-600' : 'bg-slate-700'
          )}
        >
          <span className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            form.isPublished ? 'translate-x-5' : 'translate-x-1'
          )} />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
