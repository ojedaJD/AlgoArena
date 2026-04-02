'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, ChevronDown, GraduationCap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { topicsApi } from '@/lib/api-client';
import type { Topic } from '@dsa/shared';

interface TopicWithCompletion extends Topic {
  completedLessons?: number;
}

function TopicRow({
  topic,
  depth = 0,
}: {
  topic: TopicWithCompletion;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = (topic.children?.length ?? 0) > 0;
  const completedLessons = topic.completedLessons ?? 0;
  const progress = topic.lessonCount > 0
    ? Math.round((completedLessons / topic.lessonCount) * 100)
    : 0;
  const isCompleted = completedLessons === topic.lessonCount && topic.lessonCount > 0;

  return (
    <div className={cn('border-l-2', depth === 0 ? 'border-transparent' : 'border-slate-800 ml-4')}>
      <div
        className={cn(
          'group flex items-center gap-3 px-4 py-3 rounded-lg',
          'bg-slate-900 border border-slate-800 mb-1.5',
          'hover:border-slate-700 hover:bg-slate-800/70 transition-all'
        )}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isCompleted ? 'bg-emerald-500/15' : 'bg-slate-800'
        )}>
          {isCompleted ? (
            <CheckCircle2 size={15} className="text-emerald-400" />
          ) : (
            <BookOpen size={14} className="text-slate-400" />
          )}
        </div>

        {/* Name + meta */}
        <Link href={`/topics/${topic.slug}`} className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
            {topic.title}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500">
              {topic.lessonCount} lesson{topic.lessonCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              {topic.problemCount} problem{topic.problemCount !== 1 ? 's' : ''}
            </span>
          </div>
        </Link>

        {/* Progress */}
        {topic.lessonCount > 0 && (
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-slate-500">{progress}%</span>
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-4 space-y-0">
          {topic.children!.map((child) => (
            <TopicRow key={child.id} topic={child as TopicWithCompletion} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicWithCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    topicsApi
      .list()
      .then((data) => setTopics(data as TopicWithCompletion[]))
      .catch(() => setTopics([]))
      .finally(() => setIsLoading(false));
  }, []);

  const rootTopics = topics.filter((t) => !t.parentTopicId);
  const totalLessons = topics.reduce((a, t) => a + t.lessonCount, 0);
  const totalProblems = topics.reduce((a, t) => a + t.problemCount, 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <GraduationCap size={24} className="text-blue-400 mt-0.5" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Curriculum</h1>
            <p className="text-sm text-slate-400 mt-1">
              Master DSA through a structured progression
            </p>
            {!isLoading && (
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>{topics.length} topics</span>
                <span>·</span>
                <span>{totalLessons} lessons</span>
                <span>·</span>
                <span>{totalProblems} problems</span>
              </div>
            )}
          </div>
        </div>

        {/* Topic tree */}
        <div className="space-y-1.5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
              ))
            : rootTopics.length === 0
              ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
                  <p>No topics available yet</p>
                </div>
              )
              : rootTopics.map((topic) => (
                  <TopicRow key={topic.id} topic={topic} depth={0} />
                ))}
        </div>
      </div>
    </div>
  );
}
