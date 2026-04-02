'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Reply, CornerDownRight } from 'lucide-react';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { PostEditor } from './post-editor';
import type { DiscussionPost } from '@dsa/shared';

interface ThreadDetailProps {
  posts: DiscussionPost[];
  onReply: (body: string, parentPostId?: string) => Promise<void>;
  isLoading?: boolean;
}

interface PostCardProps {
  post: DiscussionPost;
  depth?: number;
  onReply: (body: string, parentPostId?: string) => Promise<void>;
}

function PostCard({ post, depth = 0, onReply }: PostCardProps) {
  const [showReply, setShowReply] = useState(false);

  const handleReply = async (body: string) => {
    await onReply(body, post.id);
    setShowReply(false);
  };

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-8 pl-4 border-l-2 border-slate-800')}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden mt-0.5">
        {post.author.avatarUrl ? (
          <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
        ) : (
          getInitials(post.author.displayName)
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-slate-200">{post.author.displayName}</span>
          <span className="text-xs text-slate-600">{formatRelativeTime(post.createdAt)}</span>
          {post.createdAt !== post.updatedAt && (
            <span className="text-xs text-slate-700 italic">(edited)</span>
          )}
        </div>

        {/* Body */}
        <div className="text-sm text-slate-300 prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.body}
          </ReactMarkdown>
        </div>

        {/* Actions */}
        <div className="mt-2">
          <button
            onClick={() => setShowReply((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            <Reply size={12} />
            Reply
          </button>
        </div>

        {/* Reply editor */}
        {showReply && (
          <div className="mt-3">
            <PostEditor
              onSubmit={handleReply}
              onCancel={() => setShowReply(false)}
              placeholder="Write your reply..."
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ThreadDetail({ posts, onReply, isLoading }: ThreadDetailProps) {
  const rootPosts = posts.filter((p) => !p.parentPostId);
  const getReplies = (postId: string) => posts.filter((p) => p.parentPostId === postId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-1/4" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rootPosts.map((post) => {
        const replies = getReplies(post.id);
        return (
          <div key={post.id} className="space-y-4">
            <PostCard post={post} onReply={onReply} />
            {replies.map((reply) => (
              <PostCard key={reply.id} post={reply} depth={1} onReply={onReply} />
            ))}
          </div>
        );
      })}

      {posts.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">
          No replies yet. Be the first to reply!
        </p>
      )}
    </div>
  );
}
