'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { topicsApi, apiClient } from '@/lib/api-client';
import type { Topic } from '@dsa/shared';

function TopicRow({
  topic,
  depth = 0,
  onDelete,
  deleting,
}: {
  topic: Topic;
  depth?: number;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  return (
    <>
      <tr className="bg-slate-950 hover:bg-slate-900/60 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <ChevronRight size={12} className="text-slate-600 shrink-0" />}
            <span className="text-sm font-medium text-slate-200">{topic.title}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{topic.slug}</td>
        <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{topic.orderIndex}</td>
        <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{topic.lessonCount}</td>
        <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{topic.problemCount}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/topics/${topic.slug}/edit`}
              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
            >
              <Pencil size={13} />
            </Link>
            <button
              onClick={() => onDelete(topic.id)}
              disabled={deleting === topic.id}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
            >
              {deleting === topic.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          </div>
        </td>
      </tr>
      {topic.children?.map((child) => (
        <TopicRow
          key={child.id}
          topic={child}
          depth={depth + 1}
          onDelete={onDelete}
          deleting={deleting}
        />
      ))}
    </>
  );
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const data = await topicsApi.list();
      setTopics(data as Topic[]);
    } catch {
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this topic? All lessons and associations will be removed.')) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/admin/topics/${id}`);
      await fetchTopics();
    } catch {
      alert('Failed to delete topic');
    } finally {
      setDeleting(null);
    }
  };

  const rootTopics = topics.filter((t) => !t.parentTopicId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Topics</h1>
          <p className="text-sm text-slate-400 mt-0.5">{topics.length} total</p>
        </div>
        <Link
          href="/admin/topics/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Topic
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800">
              {['Title', 'Slug', 'Order', 'Lessons', 'Problems', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-slate-800 rounded" style={{ width: `${40 + (j * 13) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rootTopics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
