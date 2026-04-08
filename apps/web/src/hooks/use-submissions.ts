'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { problemsApi } from '@/lib/api-client';
import type { Submission } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';

const TERMINAL_STATUSES = new Set([
  SubmissionStatus.ACCEPTED,
  SubmissionStatus.WRONG_ANSWER,
  SubmissionStatus.TIME_LIMIT_EXCEEDED,
  SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
  SubmissionStatus.RUNTIME_ERROR,
  SubmissionStatus.COMPILATION_ERROR,
]);

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 30; // ~45 seconds

interface UseSubmissionsOptions {
  problemSlug: string;
  autoRefresh?: boolean;
}

interface UseSubmissionsReturn {
  submissions: Submission[];
  latestSubmission: Submission | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches submission history for a problem and optionally polls
 * the latest submission until it reaches a terminal status.
 */
export function useSubmissions({
  problemSlug,
  autoRefresh = false,
}: UseSubmissionsOptions): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollCount = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubmissions = useCallback(async (): Promise<Submission[]> => {
    const res = await problemsApi.getSubmissions(problemSlug) as { items: Submission[] };
    const data = res.items ?? [];
    setSubmissions(data);
    return data;
  }, [problemSlug]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchSubmissions();
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? 'Failed to fetch submissions');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubmissions]);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Poll latest non-terminal submission
  useEffect(() => {
    if (!autoRefresh) return;

    const latest = submissions[0];
    if (!latest || TERMINAL_STATUSES.has(latest.status)) {
      setIsPolling(false);
      return;
    }

    if (pollCount.current >= MAX_POLLS) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    pollCount.current += 1;

    pollTimerRef.current = setTimeout(async () => {
      try {
        const updated = await fetchSubmissions();
        const updatedLatest = updated[0];
        if (updatedLatest && TERMINAL_STATUSES.has(updatedLatest.status)) {
          setIsPolling(false);
          pollCount.current = 0;
        }
      } catch {
        setIsPolling(false);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [submissions, autoRefresh, fetchSubmissions]);

  // Reset poll count when slug changes
  useEffect(() => {
    pollCount.current = 0;
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [problemSlug]);

  return {
    submissions,
    latestSubmission: submissions[0] ?? null,
    isLoading,
    isPolling,
    error,
    refetch,
  };
}
