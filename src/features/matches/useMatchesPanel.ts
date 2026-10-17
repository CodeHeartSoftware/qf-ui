import { useState } from 'react';
import { useForwardMatches } from '@/hooks/useForwardMatches';

/** `MatchesPanel.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s hookify
 * default — the component renders, this composes `useForwardMatches` with the local
 * selected-match/refresh state (matches the `useFleet.ts` "feature's own composed hook" shape). */
export function useMatchesPanel() {
  const { matches, error, loading, refetch } = useForwardMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>();
  // Bumped whenever "Run Next Round" actually advances the match — see `buildMatchLeaderboardKey`
  // for why this is threaded into `MatchLeaderboard`'s own `key`.
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Every match, any status — the switcher lets you pick an ended/completed/forfeited one to
  // review its final leaderboard, not just an active one (an ended match's own GET route already
  // works fine regardless of status; only RESUMING one requires it to still be active). See
  // `MatchesPanel.tsx` for the one place that DOES still key off `selectedMatch.status` — whether
  // to show the run/preview/end menu at all.
  //
  // Active matches sorted first — a stable partition (JS's `sort` is spec-guaranteed stable), so
  // within "active" and within "not active" each group keeps whatever order the API already
  // returned them in, rather than getting re-sorted by status change alone. This also means the
  // no-explicit-selection fallback (`matches[0]` below) prefers an active match by default,
  // instead of picking whichever one happens to sort first server-side.
  const sortedMatches = [...matches].sort(
    (a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'),
  );
  const selectedMatch =
    sortedMatches.find((m) => m.matchId === selectedMatchId) ?? sortedMatches[0];
  const [createMatchOpen, setCreateMatchOpen] = useState(false);

  const handleMatchAdvanced = () => {
    refetch();
    setRefreshNonce((n) => n + 1);
  };

  /** A brand-new FORWARD_SHADOW match isn't in `matches` yet — refetch the list before selecting
   * it, or `setSelectedMatchId` would pick an id `matches` doesn't recognize yet. */
  // After a delete, drop a selection that no longer exists (falls back to the first match).
  const handleMatchesDeleted = (deletedMatchIds: string[]) => {
    if (selectedMatchId !== undefined && deletedMatchIds.includes(selectedMatchId)) {
      setSelectedMatchId(undefined);
    }
    refetch();
  };

  const handleForwardMatchCreated = (matchId: string) => {
    refetch();
    setSelectedMatchId(matchId);
  };

  return {
    matches: sortedMatches,
    selectedMatch,
    setSelectedMatchId,
    handleMatchAdvanced,
    createMatchOpen,
    openCreateMatch: () => {
      setCreateMatchOpen(true);
    },
    closeCreateMatch: () => {
      setCreateMatchOpen(false);
    },
    handleForwardMatchCreated,
    error,
    loading,
    refreshNonce,
    handleMatchesDeleted,
  };
}
