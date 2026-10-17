import { useApiResource } from './useApiResource';
import type { ForwardMatchSummary } from './apiTypes';

export function useForwardMatches() {
  const { data, error, loading, refetch } = useApiResource<{
    matches: ForwardMatchSummary[];
    issues: { path: string; message: string }[];
  }>('/api/forward-matches');
  return { matches: data?.matches ?? [], issues: data?.issues ?? [], error, loading, refetch };
}
