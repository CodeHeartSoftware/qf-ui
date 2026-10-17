import Dropdown from '@/components/ui/Dropdown';
import type { BotSummary } from '@/hooks/apiTypes';

export default function BotSwitcher({
  bots,
  selectedBotId,
  onSelect,
}: {
  bots: BotSummary[];
  selectedBotId: string | undefined;
  onSelect: (botId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-3">Model</span>
      <Dropdown
        options={bots.map((bot) => ({ value: bot.id, label: bot.name }))}
        selectedValue={selectedBotId}
        onSelect={onSelect}
      />
    </div>
  );
}
