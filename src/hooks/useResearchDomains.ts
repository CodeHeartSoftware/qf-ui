import { useApiResource } from './useApiResource';
import type { ResearchDomainSummary } from './apiTypes';

export function useResearchDomains() {
  const { data, error, loading, refetch } = useApiResource<{ domains: ResearchDomainSummary[] }>(
    '/api/research',
  );
  return { domains: data?.domains ?? [], error, loading, refetch };
}
