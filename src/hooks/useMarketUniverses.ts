import { useApiResource } from './useApiResource';
import type { MarketUniverse } from './apiTypes';

/** Every market universe the Jobs tab can fetch fresh prices for — one "Fetch Latest Price
 * Data" job card per entry (see `JobsPanel.tsx`), addressable independent of match state. */
export function useMarketUniverses() {
  const { data, error, loading, refetch } = useApiResource<{ universes: MarketUniverse[] }>(
    '/api/market-data/universes',
  );
  return { universes: data?.universes ?? [], error, loading, refetch };
}
