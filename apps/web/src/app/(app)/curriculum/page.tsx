'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Loader2, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { curriculumApi, type CurriculumTrack } from '@/lib/api-client';

export default function CurriculumPage() {
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    curriculumApi
      .getTracks()
      .then((data) => setTracks(data))
      .catch(() => setTracks([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Map size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Curriculum</h1>
              <p className="text-sm text-slate-400">
                Follow a structured learning path to master data structures and algorithms
              </p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="h-5 bg-slate-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && tracks.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 text-sm">No curriculum tracks available yet.</p>
          </div>
        )}

        {/* Track cards */}
        {!isLoading && tracks.length > 0 && (
          <div className="space-y-4">
            {tracks
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((track, idx) => (
                <Link
                  key={track.slug}
                  href={`/curriculum/${track.slug}`}
                  className="group flex items-center gap-5 p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60 transition-all"
                >
                  {/* Order number */}
                  <div className="size-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all shrink-0">
                    {idx + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {track.title}
                    </h2>
                    {track.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {track.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={18}
                    className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
