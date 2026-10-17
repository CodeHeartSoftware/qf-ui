import { useApiResource } from './useApiResource';
import type { ResearchDataset } from './apiTypes';

/** Pass `undefined` while no domain is selected yet (e.g. the domain list itself hasn't loaded)
 * — same "skip the fetch" convention as `useForwardMatch`. */
export function useResearch(domain: string | undefined) {
  const { data, error, loading, refetch } = useApiResource<{ dataset: ResearchDataset }>(
    domain !== undefined ? `/api/research/${encodeURIComponent(domain)}` : null,
  );
  return { dataset: data?.dataset, error, loading, refetch };
}
