'use client';

import { Check, X } from 'lucide-react';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import type { FriendWithProfile } from '@dsa/shared';

interface FriendRequestProps {
  request: FriendWithProfile & { createdAt: string };
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
}

interface FriendRequestListProps {
  requests: (FriendWithProfile & { createdAt: string })[];
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
}

function FriendRequestItem({ request, onAccept, onDecline }: FriendRequestProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
        {request.avatarUrl ? (
          <img src={request.avatarUrl} alt={request.displayName} className="w-full h-full object-cover" />
        ) : (
          getInitials(request.displayName)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{request.displayName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Sent {formatRelativeTime(request.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onAccept(request.userId)}
          title="Accept request"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-blue-600/15 text-blue-400 border border-blue-500/30',
            'hover:bg-blue-600/30 transition-colors'
          )}
        >
          <Check size={12} />
          Accept
        </button>
        <button
          onClick={() => onDecline(request.userId)}
          title="Decline request"
          className={cn(
            'p-1.5 rounded-lg text-slate-500 border border-slate-700',
            'hover:text-red-400 hover:border-red-800/50 transition-colors'
          )}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function FriendRequestList({ requests, onAccept, onDecline }: FriendRequestListProps) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">No pending requests</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {requests.map((req) => (
        <FriendRequestItem
          key={req.userId}
          request={req}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ))}
    </div>
  );
}
