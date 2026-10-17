import { useApiResource } from './useApiResource';
import type { JobRun } from './apiTypes';

/** A job's past runs (`@quant-fusion/job-run-store`) — pass `undefined` while the history section
 * is collapsed (`JobCard`'s own convention), same "skip the fetch" pattern `useExposureMap` and
 * `useResearch` already use, so rendering N job cards doesn't fire N history requests no one
 * asked to see yet. */
export function useJobRunHistory(jobId: string | undefined) {
  const { data, error, loading, refetch } = useApiResource<{ runs: JobRun[] }>(
    jobId !== undefined ? `/api/jobs/${encodeURIComponent(jobId)}/runs` : null,
  );
  return { runs: data?.runs ?? [], error, loading, refetch };
}
