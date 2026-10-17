import { useBots } from '@/hooks/useBots';
import { useForwardMatches } from '@/hooks/useForwardMatches';

/** Combines the bot registry with the forward matches each bot currently participates in — the
 * two real, independent data sources the Fleet tab needs (see `useBotFleet.ts` in the original
 * template for the shape this replaces: that hook owned simulated `bots` state directly, this one
 * only composes two read-only fetches). A bot counts as "active" once it has at least one
 * currently-`active` forward match; `bots` defaults to active-first (stable sort — otherwise
 * registry order is untouched), since that's the more useful reading order at a glance. */
export function useFleet() {
  const { bots, error: botsError, loading: botsLoading } = useBots();
  const { matches, error: matchesError, loading: matchesLoading } = useForwardMatches();

  // Active-first within each bot's own match list too (stable sort — same convention as the bot
  // sort just below), so an ended/completed/forfeited match doesn't crowd out an active one in
  // BotCard's "Forward Matches" list at a glance.
  const matchesByBotId = new Map<string, typeof matches>();
  for (const bot of bots) {
    matchesByBotId.set(
      bot.id,
      matches
        .filter((m) => m.participantIds.includes(bot.id))
        .sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active')),
    );
  }

  const isBotActive = (botId: string): boolean =>
    (matchesByBotId.get(botId) ?? []).some((m) => m.status === 'active');

  const sortedBots = [...bots].sort(
    (a, b) => Number(isBotActive(b.id)) - Number(isBotActive(a.id)),
  );

  return {
    bots: sortedBots,
    matchesByBotId,
    isBotActive,
    error: botsError ?? matchesError,
    loading: botsLoading || matchesLoading,
  };
}
