'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Topic } from '@dsa/shared';

export interface TopicFormData {
  title: string;
  slug: string;
  parentTopicId: string;
  orderIndex: number;
}

interface TopicFormProps {
  initialData?: Partial<Topic>;
  parentTopics?: Topic[];
  onSubmit: (data: TopicFormData) => Promise<void>;
  submitLabel?: string;
}

const INPUT_BASE = cn(
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5',
  'text-sm text-slate-300 placeholder:text-slate-600',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'hover:border-slate-600 transition-colors'
);

export function TopicForm({
  initialData,
  parentTopics = [],
  onSubmit,
  submitLabel = 'Save Topic',
}: TopicFormProps) {
  const [form, setForm] = useState<TopicFormData>({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    parentTopicId: initialData?.parentTopicId ?? '',
    orderIndex: initialData?.orderIndex ?? 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof TopicFormData, value: TopicFormData[typeof key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (!initialData?.slug) set('slug', autoSlug(v));
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
      setError(e.message ?? 'Failed to save topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Arrays & Hashing"
            className={INPUT_BASE}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Slug <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="arrays-hashing"
            className={INPUT_BASE}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Parent Topic
          </label>
          <select
            value={form.parentTopicId}
            onChange={(e) => set('parentTopicId', e.target.value)}
            className={cn(INPUT_BASE, 'appearance-none')}
          >
            <option value="">— Root topic —</option>
            {parentTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <p className="text-xs text-slate-600">
            Leave empty to make this a top-level topic
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Order Index
          </label>
          <input
            type="number"
            value={form.orderIndex}
            onChange={(e) => set('orderIndex', Number(e.target.value))}
            min={0}
            className={INPUT_BASE}
          />
          <p className="text-xs text-slate-600">
            Position in curriculum (0 = first)
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
