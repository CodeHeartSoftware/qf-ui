import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useBots } from '@/hooks/useBots';
import { useForwardMatches } from '@/hooks/useForwardMatches';
import type { CurrentStanding, EquityPoint, ForwardMatchDetail } from '@/hooks/apiTypes';

export interface BotPerformanceEntry {
  matchId: string;
  standing: CurrentStanding;
  marketDataUniverse: string[];
  equityHistory: EquityPoint[];
}

/** Fetches every currently-active match's full standings (no Docker — see ADR-0015) and regroups
 * them by BOT instead of by match, since a bot's own performance — not which match produced it —
 * is what this tab is about (see `features/matches/MatchesPanel.tsx` for the match-centric view).
 * A bot's entries are never summed across matches — different starting capital/dataset/universe
 * per match makes that meaningless (same reasoning `MatchLeaderboard` itself documents) — a bot
 * in more than one active match just gets more than one entry. */
export function useBotPerformance() {
  const { bots, error: botsError, loading: botsLoading } = useBots();
  const { matches, error: matchesError, loading: matchesLoading } = useForwardMatches();
  const activeMatchIdsKey = matches
    .filter((m) => m.status === 'active')
    .map((m) => m.matchId)
    .join(',');

  const [detailsByMatchId, setDetailsByMatchId] = useState<Record<string, ForwardMatchDetail>>({});
  const [fetchError, setFetchError] = useState<string>();
  const [fetching, setFetching] = useState(activeMatchIdsKey !== '');

  useEffect(() => {
    const ids = activeMatchIdsKey === '' ? [] : activeMatchIdsKey.split(',');
    if (ids.length === 0) {
      setDetailsByMatchId({});
      setFetching(false);
      return;
    }
    let cancelled = false;
    setFetching(true);
    setFetchError(undefined);
    Promise.all(
      ids.map((id) => apiGet<ForwardMatchDetail>(`/api/forward-matches/${encodeURIComponent(id)}`)),
    )
      .then((details) => {
        if (cancelled) return;
        const map: Record<string, ForwardMatchDetail> = {};
        for (const detail of details) map[detail.matchId] = detail;
        setDetailsByMatchId(map);
      })
      .catch((err: unknown) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMatchIdsKey]);

  const activeMatchIds = activeMatchIdsKey === '' ? [] : activeMatchIdsKey.split(',');
  const entriesByBotId = new Map<string, BotPerformanceEntry[]>();
  for (const bot of bots) {
    const entries: BotPerformanceEntry[] = [];
    for (const matchId of activeMatchIds) {
      const detail = detailsByMatchId[matchId];
      const standing = detail?.standings.standings.find((s) => s.participantId === bot.id);
      if (standing !== undefined) {
        entries.push({
          matchId,
          standing,
          marketDataUniverse: detail?.marketDataUniverse ?? [],
          equityHistory: detail?.equityHistoryByParticipant[bot.id] ?? [],
        });
      }
    }
    if (entries.length > 0) entriesByBotId.set(bot.id, entries);
  }

  return {
    bots: bots.filter((b) => entriesByBotId.has(b.id)),
    entriesByBotId,
    error: botsError ?? matchesError ?? fetchError,
    loading: botsLoading || matchesLoading || fetching,
  };
}
