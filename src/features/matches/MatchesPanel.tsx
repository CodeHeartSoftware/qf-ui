import PageHeader from '@/components/ui/PageHeader';
import { buildMatchLeaderboardKey } from '@/constants/ids';
import CreateMatchModal from './CreateMatchModal';
import MatchLeaderboard from './MatchLeaderboard';
import MatchSwitcher from './MatchSwitcher';
import DeleteMatchMenu from './DeleteMatchMenu';
import RunMatchMenu from './RunMatchMenu';
import { useMatchesPanel } from './useMatchesPanel';

/** Match-centric view — a switcher picks ONE forward match, any status, and the leaderboard below
 * reflects only that match (see `features/portfolio/PortfolioDashboard.tsx` for the bot-centric,
 * one-bot-at-a-time view this tab was itself split out of). An ended/completed/forfeited match
 * stays fully reviewable here — only its `RunMatchMenu` (run/preview/end) disappears, since none
 * of those make sense once a match is no longer `'active'`. State/handlers live in
 * `useMatchesPanel` — this component only renders. */
export default function MatchesPanel() {
  const {
    matches,
    selectedMatch,
    setSelectedMatchId,
    handleMatchAdvanced,
    createMatchOpen,
    openCreateMatch,
    closeCreateMatch,
    handleForwardMatchCreated,
    error,
    loading,
    refreshNonce,
    handleMatchesDeleted,
  } = useMatchesPanel();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Forward Simulations"
          subtitle="One active forward-shadow simulation's full leaderboard — resumed from the persisted snapshot, no Docker required to read."
        />
        <div className="flex items-end gap-3 flex-wrap">
          {matches.length > 0 && (
            <MatchSwitcher
              matches={matches}
              selectedMatchId={selectedMatch?.matchId}
              onSelect={setSelectedMatchId}
            />
          )}
          <button
            onClick={openCreateMatch}
            className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer"
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-background)',
              letterSpacing: '0.06em',
            }}
          >
            + CREATE SIMULATION
          </button>
          <DeleteMatchMenu
            selectedMatchId={selectedMatch?.matchId}
            inactiveCount={matches.filter((m) => m.status !== 'active').length}
            onDeleted={handleMatchesDeleted}
          />
          {selectedMatch?.status === 'active' && (
            <RunMatchMenu matchId={selectedMatch.matchId} onMatchAdvanced={handleMatchAdvanced} />
          )}
        </div>
      </div>

      <CreateMatchModal
        open={createMatchOpen}
        onClose={closeCreateMatch}
        onForwardMatchCreated={handleForwardMatchCreated}
      />

      {loading && <p className="font-mono text-xs text-muted-3">Loading simulations…</p>}
      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}
      {!loading && error === undefined && matches.length === 0 && (
        <p className="font-mono text-xs text-muted-3">No forward simulations yet.</p>
      )}

      {selectedMatch !== undefined && (
        <MatchLeaderboard
          key={buildMatchLeaderboardKey(selectedMatch.matchId, refreshNonce)}
          matchId={selectedMatch.matchId}
        />
      )}
    </div>
  );
}
