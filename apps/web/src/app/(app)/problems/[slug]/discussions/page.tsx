'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Plus, User } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { DiscussionThread } from '@dsa/shared';

function ThreadRow({ thread }: { thread: DiscussionThread }) {
  return (
    <Link
      href={`/problems/${thread.problemId}/discussions/${thread.id}`}
      className="flex items-start gap-4 px-5 py-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-colors"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {thread.author.avatarUrl ? (
          <img
            src={thread.author.avatarUrl}
            alt={thread.author.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(thread.author.displayName)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-200 truncate">{thread.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User size={11} />
            {thread.author.displayName}
          </span>
          <span>{formatRelativeTime(thread.createdAt)}</span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {thread.postCount} {thread.postCount === 1 ? 'reply' : 'replies'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DiscussionsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get<DiscussionThread[]>(`/problems/${slug}/discussions`)
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setIsLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/problems/${slug}`}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to Problem
            </Link>
            <span className="text-slate-700">|</span>
            <h1 className="text-xl font-bold text-slate-100">Discussions</h1>
          </div>
          <Link
            href={`/problems/${slug}/discussions/new`}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={14} />
            New Thread
          </Link>
        </div>

        {/* Thread list */}
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
              ))
            : threads.length === 0
              ? (
                <div className="text-center py-16 text-slate-500">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No discussions yet</p>
                  <p className="text-sm mt-1">Be the first to start a conversation!</p>
                </div>
              )
              : threads.map((t) => <ThreadRow key={t.id} thread={t} />)}
        </div>
      </div>
    </div>
  );
}
