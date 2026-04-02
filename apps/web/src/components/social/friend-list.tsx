'use client';

import Link from 'next/link';
import { UserMinus, Sword, MoreHorizontal } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { FriendWithProfile } from '@dsa/shared';

interface FriendListProps {
  friends: FriendWithProfile[];
  onChallenge?: (userId: string) => void;
  onRemove?: (userId: string) => void;
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span className={cn(
      'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900',
      online ? 'bg-emerald-400' : 'bg-slate-600'
    )} />
  );
}

export function FriendList({ friends, onChallenge, onRemove }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p className="text-sm">No friends yet.</p>
        <p className="text-xs mt-1">Search for players to add them!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {friends.map((friend) => (
        <div
          key={friend.userId}
          className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
        >
          {/* Avatar with online indicator */}
          <Link href={`/profile/${friend.userId}`}>
            <div className="relative w-9 h-9 shrink-0">
              <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.displayName} className="w-full h-full object-cover" />
                ) : (
                  getInitials(friend.displayName)
                )}
              </div>
              <OnlineDot online={friend.online} />
            </div>
          </Link>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${friend.userId}`}>
              <p className="text-sm font-medium text-slate-200 hover:text-white transition-colors truncate">
                {friend.displayName}
              </p>
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {friend.rating !== null && (
                <span className="text-xs text-slate-500">
                  {friend.rating} rating
                </span>
              )}
              <span className={cn(
                'text-xs',
                friend.online ? 'text-emerald-400' : 'text-slate-600'
              )}>
                {friend.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onChallenge && (
              <button
                onClick={() => onChallenge(friend.userId)}
                title="Challenge to a match"
                className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              >
                <Sword size={14} />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(friend.userId)}
                title="Remove friend"
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <UserMinus size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
