import { useState } from 'react';
import { apiGet } from '@/lib/api';
import { useApiResource } from './useApiResource';
import type { ExposureMap, ModelEffect, ResearchDelta, ThesisGroups } from './apiTypes';

/** One security's `ExposureMap` for `domain` — already reflects any relationship types a person
 * has sorted into one of its manufacturing/qualification/contract/program categories (see
 * `apps/api`'s `quantAnalysis.ts`'s own `applyRelationshipTypeCategories` doc
 * comment) — skipped (no fetch) while `entityId` is undefined, e.g. before the user has picked
 * one from the entity dropdown. */
export function useExposureMap(domain: string, entityId: string | undefined) {
  const { data, error, loading, refetch } = useApiResource<{ exposure: ExposureMap }>(
    entityId !== undefined
      ? `/api/research/${encodeURIComponent(domain)}/exposure/${encodeURIComponent(entityId)}`
      : null,
  );
  return { exposure: data?.exposure, error, loading, refetch };
}

/** Auto-fetched once per domain (no params to pick first) — which tracked tickers the risk
 * engine's own `applyThesisGroupCaps` would currently treat as one correlated bet. */
export function useThesisGroups(domain: string) {
  const { data, error, loading, refetch } = useApiResource<ThesisGroups>(
    `/api/research/${encodeURIComponent(domain)}/thesis-groups`,
  );
  return { thesisGroups: data, error, loading, refetch };
}

export interface ResearchDeltaResponse {
  delta: ResearchDelta;
  effects: ModelEffect[];
}

/** On-demand (not auto-fetched): a person picks a target entity and a date range, then calls
 * `compute()` — a GET with query params, so this doesn't fit `useApiAction`'s POST/DELETE shape. */
export function useResearchDeltaTool(domain: string) {
  const [result, setResult] = useState<ResearchDeltaResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const compute = async (targetEntityId: string, from: string, to: string) => {
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const params = new URLSearchParams({ targetEntityId, from, to });
      const response = await apiGet<ResearchDeltaResponse>(
        `/api/research/${encodeURIComponent(domain)}/delta?${params.toString()}`,
      );
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return { compute, result, loading, error };
}
