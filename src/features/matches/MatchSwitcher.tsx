import Dropdown from '@/components/ui/Dropdown';
import type { ForwardMatchSummary } from '@/hooks/apiTypes';

export default function MatchSwitcher({
  matches,
  selectedMatchId,
  onSelect,
}: {
  matches: ForwardMatchSummary[];
  selectedMatchId: string | undefined;
  onSelect: (matchId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-3">
        Simulation
      </span>
      <Dropdown
        options={matches.map((m) => ({
          value: m.matchId,
          label:
            m.status === 'active'
              ? `${m.matchId} (${String(m.roundsPlayed)} trading days)`
              : `${m.matchId} (${String(m.roundsPlayed)} trading days, ${m.status})`,
        }))}
        selectedValue={selectedMatchId}
        onSelect={onSelect}
      />
    </div>
  );
}
