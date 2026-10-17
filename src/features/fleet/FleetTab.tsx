import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import BotCard from './BotCard';
import BotFilterBar, { type FleetFilter } from './BotFilterBar';
import { useFleet } from './useFleet';

export default function FleetTab() {
  const { bots, matchesByBotId, isBotActive, error, loading } = useFleet();
  const [filter, setFilter] = useState<FleetFilter>('all');

  const counts: Record<FleetFilter, number> = {
    all: bots.length,
    active: bots.filter((b) => isBotActive(b.id)).length,
    inactive: bots.filter((b) => !isBotActive(b.id)).length,
  };
  const filteredBots =
    filter === 'all' ? bots : bots.filter((b) => isBotActive(b.id) === (filter === 'active'));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <PageHeader
          title="Model Fleet"
          subtitle="Every registered model and the forward simulations it's currently part of."
        />
      </div>
      <BotFilterBar activeFilter={filter} onFilterChange={setFilter} counts={counts} />
      {loading && <p className="font-mono text-xs text-muted-3">Loading model registry…</p>}
      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}
      {!loading && error === undefined && filteredBots.length === 0 && (
        <p className="font-mono text-xs text-muted-3">
          {bots.length === 0
            ? 'No models found under bots/stock-market-4/ — nothing registered yet.'
            : 'No models match this filter.'}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {filteredBots.map((bot) => (
          <BotCard key={bot.id} bot={bot} matches={matchesByBotId.get(bot.id) ?? []} />
        ))}
      </div>
    </div>
  );
}
