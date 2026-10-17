import { useApiResource } from './useApiResource';
import type { BotSummary } from './apiTypes';

export function useBots() {
  const { data, error, loading } = useApiResource<{ bots: BotSummary[] }>('/api/bots');
  return { bots: data?.bots ?? [], error, loading };
}
