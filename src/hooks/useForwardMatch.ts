import { useApiResource } from './useApiResource';
import type { ForwardMatchDetail } from './apiTypes';

/** Resumes one persisted match (no Docker — see ADR-0015) and returns its real per-bot standings.
 * Used by both the Fleet tab (one bot's slice of a match it's in) and Simulation → Bot Portfolios (the
 * whole leaderboard for a match). */
export function useForwardMatch(matchId: string | undefined) {
  const { data, error, loading } = useApiResource<ForwardMatchDetail>(
    matchId !== undefined ? `/api/forward-matches/${encodeURIComponent(matchId)}` : null,
  );
  return { match: data, error, loading };
}
