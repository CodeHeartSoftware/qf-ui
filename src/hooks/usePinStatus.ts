import { useApiResource } from './useApiResource';
import type { MatchPinStatus } from './apiTypes';

/** Each participant's pin state for one match — see `MatchPinStatus`. */
export function usePinStatus(matchId: string) {
  const { data, error, loading, refetch } = useApiResource<MatchPinStatus>(
    `/api/forward-matches/${encodeURIComponent(matchId)}/pin-status`,
  );
  return { pinStatus: data, error, loading, refetch };
}
