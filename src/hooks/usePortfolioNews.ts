import { useApiResource } from './useApiResource';
import type { PortfolioNewsFeed } from './apiTypes';

/** Live, un-persisted — every call re-fetches Google News fresh for `domain`'s own tracked
 * tickers (see `/api/news/:domain`, backed by `@quant-fusion/research-store`'s `tracked_tickers`),
 * no dataset write. Scoped per domain so a domain with no tracked tickers (a fresh one, or
 * `quantum`) correctly shows no articles instead of another domain's. Only mounted when the News
 * Feed tab is actually open (`NewsFeedSection`), so opening the Research panel doesn't itself
 * trigger an external fetch. */
export function usePortfolioNews(domain: string | undefined) {
  const { data, error, loading, refetch } = useApiResource<PortfolioNewsFeed>(
    domain !== undefined ? `/api/news/${encodeURIComponent(domain)}` : null,
  );
  return { feeds: data?.feeds ?? [], fetchedAt: data?.fetchedAt, error, loading, refetch };
}
