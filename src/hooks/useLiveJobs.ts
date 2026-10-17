import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { LiveJob } from './apiTypes';

const POLL_MS = 3000;

/** Every running (or just-finished) job, without logs — polled for the header's job indicator,
 * so a run started from any tab (or before a page reload) is always one click from its log.
 * Errors are swallowed: an API mid-restart just means "no update this tick". */
export function useLiveJobs() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      apiGet<{ jobs: LiveJob[] }>('/api/jobs/live')
        .then((data) => {
          if (!cancelled) setJobs(data.jobs);
        })
        .catch(() => undefined);
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return jobs;
}
