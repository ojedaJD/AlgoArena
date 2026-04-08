'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, BookOpen, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { curriculumApi, type LessonDetail, type LessonProgressEntry } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export default function LessonReaderPage() {
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [progress, setProgress] = useState<LessonProgressEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      curriculumApi.getLesson(lessonId),
      curriculumApi.getProgress(),
    ])
      .then(([lessonResult, progressResult]) => {
        if (lessonResult.status === 'fulfilled') setLesson(lessonResult.value);
        if (progressResult.status === 'fulfilled') {
          const p = progressResult.value;
          setProgress(p.lessons[lessonId] ?? null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [lessonId]);

  const updateProgress = useCallback(
    async (status: 'IN_PROGRESS' | 'COMPLETED') => {
      setIsUpdating(true);
      try {
        const updated = await curriculumApi.updateLessonProgress(lessonId, status);
        setProgress(updated);
      } catch {
        // silently fail
      } finally {
        setIsUpdating(false);
      }
    },
    [lessonId]
  );

  const status = progress?.status ?? 'NOT_STARTED';

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/curriculum"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back to Curriculum
        </Link>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-2/3" />
            <div className="h-4 bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-800 rounded w-5/6" />
            <div className="h-4 bg-slate-800 rounded w-4/6" />
          </div>
        )}

        {/* Not found */}
        {!isLoading && !lesson && (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">Lesson not found.</p>
          </div>
        )}

        {/* Lesson content */}
        {!isLoading && lesson && (
          <>
            {/* Title and status */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-100">{lesson.title}</h1>
                {status === 'COMPLETED' && (
                  <div className="flex items-center gap-1.5 text-emerald-500 shrink-0 mt-1">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                )}
                {status === 'IN_PROGRESS' && (
                  <div className="flex items-center gap-1.5 text-blue-400 shrink-0 mt-1">
                    <PlayCircle size={18} />
                    <span className="text-xs font-medium">In Progress</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mb-8">
              {status === 'NOT_STARTED' && (
                <Button
                  variant="primary"
                  size="md"
                  loading={isUpdating}
                  leftIcon={<PlayCircle size={16} />}
                  onClick={() => updateProgress('IN_PROGRESS')}
                >
                  Start Reading
                </Button>
              )}
              {status === 'IN_PROGRESS' && (
                <Button
                  variant="success"
                  size="md"
                  loading={isUpdating}
                  leftIcon={<CheckCircle2 size={16} />}
                  onClick={() => updateProgress('COMPLETED')}
                >
                  Mark as Complete
                </Button>
              )}
              {status === 'COMPLETED' && (
                <Button
                  variant="ghost"
                  size="md"
                  loading={isUpdating}
                  onClick={() => updateProgress('IN_PROGRESS')}
                >
                  Mark as In Progress
                </Button>
              )}
            </div>

            {/* Markdown content */}
            <article className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400 prose-strong:text-slate-200 prose-code:text-emerald-400 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-li:text-slate-300 prose-hr:border-slate-800">
              <ReactMarkdown>{lesson.contentMd || '_No content yet._'}</ReactMarkdown>
            </article>

            {/* Bottom action */}
            {status !== 'COMPLETED' && (
              <div className="mt-12 pt-6 border-t border-slate-800 flex justify-end">
                <Button
                  variant="success"
                  size="lg"
                  loading={isUpdating}
                  leftIcon={<CheckCircle2 size={18} />}
                  onClick={() => updateProgress('COMPLETED')}
                >
                  Mark as Complete
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
