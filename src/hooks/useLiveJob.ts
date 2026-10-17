import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { LiveJob } from './apiTypes';

const POLL_MS = 1000;

/** Follows one live job (`/api/jobs/live/:id`) until it finishes, accumulating its log from the
 * last offset each poll rather than re-downloading the whole thing. A failed poll is NOT fatal:
 * a daily cycle's own price-fetch rebuild restarts the API under `tsx watch` mid-job, so the
 * hook just reports `reconnecting` and keeps polling — the job itself runs detached and is
 * still there when the API comes back. Pass `undefined` to follow nothing. */
export function useLiveJob(jobId: string | undefined) {
  const [job, setJob] = useState<LiveJob>();
  const [reconnecting, setReconnecting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setJob(undefined);
    setReconnecting(false);
    setNotFound(false);
    if (jobId === undefined) return;

    let cancelled = false;
    let output = '';
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async (): Promise<void> => {
      try {
        const { job: next } = await apiGet<{ job: LiveJob }>(
          `/api/jobs/live/${encodeURIComponent(jobId)}?since=${String(output.length)}`,
        );
        if (cancelled) return;
        output = output.slice(0, next.outputOffset ?? 0) + next.output;
        setJob({ ...next, output });
        setReconnecting(false);
        if (next.status !== 'running') return;
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.message.startsWith('No live job')) {
          setNotFound(true);
          return;
        }
        setReconnecting(true);
      }
      timer = setTimeout(() => void poll(), POLL_MS);
    };
    void poll();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [jobId]);

  return { job, reconnecting, notFound };
}
