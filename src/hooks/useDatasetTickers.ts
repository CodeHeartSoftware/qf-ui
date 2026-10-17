import { useApiResource } from './useApiResource';

/** Every REAL ticker currently published for one dataset id+version — distinct from a
 * `MarketUniverse`'s own `tickers` (a curated subset), since a symbol added via
 * `POST /api/market-data/tickers` (see `useAddNewSymbol.ts`) may not belong to any universe's
 * curated list yet. Pass `undefined` for either id to skip fetching (e.g. no base universe
 * picked yet). */
export function useDatasetTickers(
  datasetId: string | undefined,
  datasetVersion: string | undefined,
) {
  const path =
    datasetId !== undefined && datasetVersion !== undefined
      ? `/api/market-data/tickers?datasetId=${encodeURIComponent(datasetId)}&datasetVersion=${encodeURIComponent(datasetVersion)}`
      : null;
  const { data, error, loading, refetch } = useApiResource<{ tickers: string[] }>(path);
  return { tickers: data?.tickers ?? [], error, loading, refetch };
}
