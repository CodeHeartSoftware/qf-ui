import Dropdown from '@/components/ui/Dropdown';
import type { BotPerformanceEntry } from './useBotPerformance';

/** Scoped to the currently-switched-to bot's OWN matches (`BotSwitcher` picks the bot; this picks
 * which of ITS active matches to inspect) — most bots are only ever in one, but a bot can be in
 * more than one active match at once (see `useBotPerformance`'s doc comment), and each match's
 * standings are never combined into one number. */
export default function BotMatchSwitcher({
  entries,
  selectedMatchId,
  onSelect,
}: {
  entries: BotPerformanceEntry[];
  selectedMatchId: string | undefined;
  onSelect: (matchId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-3">
        Simulation
      </span>
      <Dropdown
        options={entries.map((e) => ({
          value: e.matchId,
          label: `${e.matchId} (rank #${String(e.standing.rank)})`,
        }))}
        selectedValue={selectedMatchId}
        onSelect={onSelect}
      />
    </div>
  );
}
