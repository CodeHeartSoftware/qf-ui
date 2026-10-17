import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import BotDetailPanel from './BotDetailPanel';
import BotMatchSwitcher from './BotMatchSwitcher';
import BotSwitcher from './BotSwitcher';
import { useBotPerformance } from './useBotPerformance';

/** Bot-centric by design — the bot switcher picks ONE bot, the match switcher (scoped to THAT
 * bot's own active matches) picks which one of its matches to inspect, and everything below
 * reflects only that (bot, match) pair (see `features/matches/MatchesPanel.tsx` for the
 * match-centric, all-bots-at-once leaderboard this was split out of). Bots default-ranked by
 * return so the bot switcher's default selection is the current top performer; switching bots
 * falls back to that bot's own first match rather than requiring a fresh match pick every time. */
export default function PortfolioDashboard() {
  const { bots, entriesByBotId, error, loading } = useBotPerformance();
  const [selectedBotId, setSelectedBotId] = useState<string>();
  const [selectedMatchId, setSelectedMatchId] = useState<string>();

  const ranked = [...bots].sort((a, b) => {
    const aReturn = entriesByBotId.get(a.id)?.[0]?.standing.totalReturn ?? 0;
    const bReturn = entriesByBotId.get(b.id)?.[0]?.standing.totalReturn ?? 0;
    return bReturn - aReturn;
  });
  const selectedBot = ranked.find((b) => b.id === selectedBotId) ?? ranked[0];
  const botEntries = selectedBot !== undefined ? (entriesByBotId.get(selectedBot.id) ?? []) : [];
  const selectedEntry = botEntries.find((e) => e.matchId === selectedMatchId) ?? botEntries[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Portfolio"
          subtitle="Real per-model performance, resumed from the persisted snapshot — no Docker required to read."
        />
        {ranked.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <BotSwitcher
              bots={ranked}
              selectedBotId={selectedBot?.id}
              onSelect={setSelectedBotId}
            />
            {botEntries.length > 0 && (
              <BotMatchSwitcher
                entries={botEntries}
                selectedMatchId={selectedEntry?.matchId}
                onSelect={setSelectedMatchId}
              />
            )}
          </div>
        )}
      </div>

      {loading && <p className="font-mono text-xs text-muted-3">Loading model performance…</p>}
      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}
      {!loading && error === undefined && ranked.length === 0 && (
        <p className="font-mono text-xs text-muted-3">
          No model is currently part of an active forward simulation.
        </p>
      )}

      {selectedBot !== undefined && <BotDetailPanel bot={selectedBot} entry={selectedEntry} />}
    </div>
  );
}
