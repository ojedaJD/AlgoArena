'use client';

import Link from 'next/link';
import { MessageSquare, User, Clock } from 'lucide-react';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import type { DiscussionThread } from '@dsa/shared';

interface ThreadListProps {
  threads: DiscussionThread[];
  basePath?: string; // e.g. "/problems/two-sum/discussions"
  isLoading?: boolean;
}

function SkeletonThread() {
  return (
    <div className="flex gap-4 px-5 py-4 bg-slate-900 border border-slate-800 rounded-lg animate-pulse">
      <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="h-3 bg-slate-800 rounded w-1/3" />
      </div>
    </div>
  );
}

export function ThreadList({ threads, basePath = '', isLoading }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonThread key={i} />)}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <MessageSquare size={30} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">No threads yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`${basePath}/${thread.id}`}
          className="flex items-start gap-4 px-5 py-4 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800/80 hover:border-slate-700 transition-all"
        >
          {/* Author avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
            {thread.author.avatarUrl ? (
              <img src={thread.author.avatarUrl} alt={thread.author.displayName} className="w-full h-full object-cover" />
            ) : (
              getInitials(thread.author.displayName)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 truncate">{thread.title}</p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User size={10} />
                {thread.author.displayName}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatRelativeTime(thread.updatedAt)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={10} />
                {thread.postCount} {thread.postCount === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
