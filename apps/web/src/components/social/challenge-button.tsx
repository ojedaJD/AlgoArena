'use client';

import { useState } from 'react';
import { Sword, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { MatchMode } from '@dsa/shared';

interface ChallengeButtonProps {
  targetUserId: string;
  targetDisplayName: string;
  className?: string;
  size?: 'sm' | 'md';
}

type State = 'idle' | 'sending' | 'sent' | 'error';

export function ChallengeButton({
  targetUserId,
  targetDisplayName,
  className,
  size = 'md',
}: ChallengeButtonProps) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChallenge = async () => {
    setState('sending');
    setErrorMsg('');
    try {
      await apiClient.post('/matches/challenge', {
        targetUserId,
        mode: MatchMode.FRIEND,
      });
      setState('sent');
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message ?? 'Failed to send challenge');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <button
        onClick={handleChallenge}
        disabled={state === 'sending' || state === 'sent'}
        title={`Challenge ${targetDisplayName}`}
        className={cn(
          'flex items-center gap-1.5 font-medium rounded-lg transition-all border',
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
          state === 'sent'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed'
            : state === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {state === 'sending' ? (
          <Loader2 size={isSmall ? 11 : 14} className="animate-spin" />
        ) : state === 'sent' ? (
          <Check size={isSmall ? 11 : 14} />
        ) : (
          <Sword size={isSmall ? 11 : 14} />
        )}
        {state === 'sent'
          ? 'Challenge sent!'
          : state === 'sending'
            ? 'Sending...'
            : 'Challenge'}
      </button>
      {state === 'error' && errorMsg && (
        <p className="text-[11px] text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
