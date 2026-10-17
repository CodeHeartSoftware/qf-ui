import { useApiResource } from './useApiResource';
import type { MarketDataStatus } from './apiTypes';

export function useMarketDataStatus() {
  const { data, error, loading } = useApiResource<MarketDataStatus>('/api/market-data/status');
  return { datasets: data?.datasets ?? [], research: data?.research, error, loading };
}
