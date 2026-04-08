'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Code2,
  CheckCircle2,
  Circle,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  curriculumApi,
  type CurriculumTrackDetail,
  type CurriculumSection,
  type CurriculumItem,
  type CurriculumProgress,
} from '@/lib/api-client';

const KIND_ICONS = {
  LESSON: BookOpen,
  TOPIC: GraduationCap,
  PROBLEM: Code2,
};

const KIND_COLORS = {
  LESSON: 'text-blue-400',
  TOPIC: 'text-purple-400',
  PROBLEM: 'text-emerald-400',
};

function getItemHref(item: CurriculumItem): string | null {
  switch (item.kind) {
    case 'LESSON':
      return `/lessons/${item.refId}`;
    case 'PROBLEM':
      return `/problems/${item.refId}`;
    case 'TOPIC':
      return `/topics/${item.refId}`;
    default:
      return null;
  }
}

function SectionGroup({
  section,
  progress,
  defaultOpen,
}: {
  section: CurriculumSection;
  progress: CurriculumProgress | null;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const items = section.items.sort((a, b) => a.orderIndex - b.orderIndex);
  const completedCount = items.filter(
    (item) => item.kind === 'LESSON' && progress?.lessons[item.refId]?.status === 'COMPLETED'
  ).length;
  const lessonCount = items.filter((i) => i.kind === 'LESSON').length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            size={16}
            className={cn(
              'text-slate-500 transition-transform',
              !isOpen && '-rotate-90'
            )}
          />
          <h3 className="text-sm font-semibold text-slate-200">{section.title}</h3>
        </div>
        {lessonCount > 0 && (
          <span className="text-xs text-slate-500">
            {completedCount}/{lessonCount} complete
          </span>
        )}
      </button>

      {/* Items */}
      {isOpen && (
        <div className="border-t border-slate-800">
          {items.map((item) => {
            const Icon = KIND_ICONS[item.kind] ?? BookOpen;
            const colorClass = KIND_COLORS[item.kind] ?? 'text-slate-400';
            const href = getItemHref(item);
            const lessonProgress = item.kind === 'LESSON' ? progress?.lessons[item.refId] : null;
            const isCompleted = lessonProgress?.status === 'COMPLETED';
            const isInProgress = lessonProgress?.status === 'IN_PROGRESS';

            const content = (
              <div className="flex items-center gap-3.5 px-5 py-3 hover:bg-slate-800/40 transition-colors group">
                {/* Status indicator */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : isInProgress ? (
                    <PlayCircle size={18} className="text-blue-400" />
                  ) : (
                    <Circle size={18} className="text-slate-700" />
                  )}
                </div>

                {/* Kind icon */}
                <Icon size={16} className={cn(colorClass, 'shrink-0')} />

                {/* Title */}
                <span
                  className={cn(
                    'flex-1 text-sm',
                    isCompleted
                      ? 'text-slate-500 line-through decoration-slate-700'
                      : 'text-slate-300 group-hover:text-white transition-colors'
                  )}
                >
                  {item.title}
                </span>

                {/* Kind badge */}
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600 shrink-0">
                  {item.kind}
                </span>

                {href && (
                  <ChevronRight
                    size={14}
                    className="text-slate-700 group-hover:text-slate-400 shrink-0"
                  />
                )}
              </div>
            );

            if (href) {
              return (
                <Link key={item.id} href={href}>
                  {content}
                </Link>
              );
            }

            return <div key={item.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}

export default function TrackDetailPage() {
  const params = useParams();
  const trackSlug = params.trackSlug as string;

  const [track, setTrack] = useState<CurriculumTrackDetail | null>(null);
  const [progress, setProgress] = useState<CurriculumProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      curriculumApi.getTrack(trackSlug),
      curriculumApi.getProgress(),
    ])
      .then(([trackResult, progressResult]) => {
        if (trackResult.status === 'fulfilled') setTrack(trackResult.value);
        if (progressResult.status === 'fulfilled') setProgress(progressResult.value);
      })
      .finally(() => setIsLoading(false));
  }, [trackSlug]);

  const sections = track?.sections?.sort((a, b) => a.orderIndex - b.orderIndex) ?? [];

  const totalLessons = sections.reduce(
    (sum, s) => sum + s.items.filter((i) => i.kind === 'LESSON').length,
    0
  );
  const completedLessons = sections.reduce(
    (sum, s) =>
      sum +
      s.items.filter(
        (i) => i.kind === 'LESSON' && progress?.lessons[i.refId]?.status === 'COMPLETED'
      ).length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/curriculum"
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
          ) : track ? (
            <>
              <h1 className="text-2xl font-bold text-slate-100">{track.title}</h1>
              {track.description && (
                <p className="text-sm text-slate-400 mt-1">{track.description}</p>
              )}

              {/* Progress bar */}
              {totalLessons > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">
                      {completedLessons} of {totalLessons} lessons completed
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500">Track not found</p>
          )}
        </div>

        {/* Sections */}
        {!isLoading && track && (
          <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No sections yet for this track</p>
              </div>
            ) : (
              sections.map((section, idx) => (
                <SectionGroup
                  key={section.id}
                  section={section}
                  progress={progress}
                  defaultOpen={idx === 0}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
