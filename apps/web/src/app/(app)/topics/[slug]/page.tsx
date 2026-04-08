'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Code2, ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { topicsApi } from '@/lib/api-client';
import type { Topic, Lesson, ProblemSummary } from '@dsa/shared';

interface TopicDetail extends Topic {
  lessons?: Lesson[];
  problems?: ProblemSummary[];
}

type Tab = 'lessons' | 'problems';

export default function TopicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');

  useEffect(() => {
    setIsLoading(true);
    topicsApi
      .getBySlug(slug)
      .then((data) => setTopic(data as TopicDetail))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  const lessons = topic?.lessons ?? [];
  const problems = topic?.problems ?? [];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/topics"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Back to Curriculum
          </Link>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-800 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-1/3" />
            </div>
          ) : topic ? (
            <>
              <h1 className="text-2xl font-bold text-slate-100">{topic.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {topic.lessonCount} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 size={14} />
                  {topic.problemCount} problems
                </span>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Topic not found</p>
          )}
        </div>

        {/* Tabs */}
        {!isLoading && topic && (
          <>
            <div className="flex gap-1 mb-5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
              {([
                { id: 'lessons' as Tab, label: 'Lessons', count: lessons.length },
                { id: 'problems' as Tab, label: 'Problems', count: problems.length },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700 text-slate-400'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Lessons list */}
            {activeTab === 'lessons' && (
              <div className="space-y-1.5">
                {lessons.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No lessons yet for this topic</p>
                  </div>
                ) : (
                  lessons.map((lesson, idx) => (
                    <Link
                      key={lesson.id}
                      href={`/topics/${slug}/lessons/${lesson.id}`}
                      className="flex items-center gap-4 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800/70 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                          {lesson.title}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Problems list */}
            {activeTab === 'problems' && (
              <div className="space-y-1.5">
                {problems.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Code2 size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No problems linked to this topic yet</p>
                  </div>
                ) : (
                  problems.map((problem) => {
                    const diffColors: Record<string, string> = {
                      EASY: 'text-emerald-400',
                      MEDIUM: 'text-yellow-400',
                      HARD: 'text-red-400',
                    };
                    return (
                      <Link
                        key={problem.id}
                        href={`/problems/${problem.slug}`}
                        className="flex items-center gap-4 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800/70 transition-all group"
                      >
                        <div className="w-5 h-5 shrink-0">
                          {problem.solvedByUser ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-700" />
                          )}
                        </div>
                        <p className="flex-1 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                          {problem.title}
                        </p>
                        <span className={cn('text-xs font-semibold', diffColors[problem.difficulty] ?? 'text-slate-400')}>
                          {problem.difficulty}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
