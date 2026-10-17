import { useEffect, useMemo, useState } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import Tag from '@/components/ui/Tag';
import { usePortfolioNews } from '@/hooks/usePortfolioNews';
import type { ResearchDataset } from '@/hooks/apiTypes';
import { colorForSlug } from '@/utils/format';
import ManageTickersModal from './ManageTickersModal';
import NewsAgentModal from './NewsAgentModal';
import ResearchUpdateModal, { type NewsItemContext } from './ResearchUpdateModal';

const ALL_TICKERS_VALUE = '__all__';
const PAGE_SIZE = 10;

const dateInputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
};

/** A live, read-only feed — no dataset write. Fetches Google News (free, keyless, searchable by
 * company name — see `apps/api`'s `googleNewsRss.ts`) for `domain`'s own tracked
 * tickers (`@quant-fusion/research-store`'s `tracked_tickers` — editable via "Manage Tickers"
 * below, not a hardcoded list). Deliberately does NOT turn a headline into `Evidence`/a
 * relationship/an event on its own: deciding whether a headline is actually a new, schema-worthy
 * development still needs judgment (a human glance, or `portfolio-research-update-skill.md`'s own
 * pipeline) that a plain fetch can't replace — this is raw material for that step, not a
 * substitute for it. */
export default function NewsFeedSection({
  domain,
  researchDataset,
  onResearchUpdated,
}: {
  domain: string;
  /** The Research tab's already-loaded dataset for `domain`, passed down rather than fetched
   * again here — the "Add to Research" modal needs it for existing-entity/relationship/hypothesis
   * lookups, and reusing this one avoids a second, redundant `GET /api/research/:domain` every
   * time the modal opens. */
  researchDataset: ResearchDataset | undefined;
  /** Called after a successful submit so the rest of the Research tab (Entities, Relationships,
   * Hypotheses, Events, Overview counts) picks up the change immediately — without this, only a
   * domain switch (or a page reload) would trigger `ResearchPanel`'s own refetch. */
  onResearchUpdated: () => void;
}) {
  const { feeds, fetchedAt, error, loading, refetch } = usePortfolioNews(domain);
  const [selectedTicker, setSelectedTicker] = useState<string>(ALL_TICKERS_VALUE);
  // Same "no bound" convention as `EventTimeline`'s own date filter — empty means unbounded.
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [modalItem, setModalItem] = useState<NewsItemContext>();
  const [manageTickersOpen, setManageTickersOpen] = useState(false);
  const [newsAgentOpen, setNewsAgentOpen] = useState(false);

  const totalItems = useMemo(() => feeds.reduce((n, f) => n + f.items.length, 0), [feeds]);

  const visibleItems = useMemo(() => {
    const relevant =
      selectedTicker === ALL_TICKERS_VALUE
        ? feeds
        : feeds.filter((f) => f.ticker === selectedTicker);
    return relevant
      .flatMap((f) =>
        f.items.map((item) => ({
          ...item,
          ticker: f.ticker,
          companyName: f.companyName,
        })),
      )
      .filter((item) => {
        const date = item.publishedAt.slice(0, 10);
        if (fromDate.length > 0 && date < fromDate) return false;
        if (toDate.length > 0 && date > toDate) return false;
        return true;
      })
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [feeds, selectedTicker, fromDate, toDate]);

  // A filter change can easily land you past the end of the new, shorter result set — reset to
  // page 1 rather than showing an empty page the user has to notice and back out of.
  useEffect(() => {
    setPage(0);
  }, [selectedTicker, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedItems = visibleItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const failedTickers = feeds.filter((f) => f.error !== undefined).map((f) => f.ticker);

  if (loading) {
    return <p className="font-mono text-xs text-muted-3">Fetching news for tracked tickers…</p>;
  }
  if (error !== undefined) {
    return <p className="font-mono text-xs text-danger">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Dropdown
              options={[
                { value: ALL_TICKERS_VALUE, label: `All Tickers (${String(totalItems)})` },
                ...feeds.map((f) => ({
                  value: f.ticker,
                  label: `${f.ticker} (${String(f.items.length)})`,
                })),
              ]}
              selectedValue={selectedTicker}
              onSelect={setSelectedTicker}
            />
            <button
              onClick={() => {
                setManageTickersOpen(true);
              }}
              className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
            >
              Manage Tickers
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
              Date
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
              }}
              className="font-mono text-[11px] text-muted"
              style={dateInputStyle}
            />
            <span className="font-mono text-[10px] text-muted-4">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
              className="font-mono text-[11px] text-muted"
              style={dateInputStyle}
            />
            {(fromDate.length > 0 || toDate.length > 0) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="font-mono text-[9px] uppercase tracking-widest text-muted-3 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {fetchedAt !== undefined && (
            <span className="font-mono text-[10px] text-muted-4">
              fetched {new Date(fetchedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => {
              refetch();
            }}
            className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              setNewsAgentOpen(true);
            }}
            className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer"
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-background)',
            }}
          >
            Run News Research Agent
          </button>
        </div>
      </div>

      {feeds.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">
          No tickers tracked for this domain yet — use "Manage Tickers" to add one.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No news found for this selection.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pagedItems.map((item, i) => (
              <div
                key={`${item.link}-${String(i)}`}
                className="p-4"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-3)',
                  borderRadius: 2,
                }}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-[10px] text-muted-2">
                    {item.publishedAt.slice(0, 10)}
                  </span>
                  <Tag label={item.ticker} color={colorForSlug(item.ticker)} />
                  <span className="font-mono text-[10px] text-muted-4">{item.source}</span>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">{item.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setModalItem(item);
                    }}
                    className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-[1px] border cursor-pointer"
                    style={{
                      background: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                      color: 'var(--color-background)',
                    }}
                  >
                    Add to Research
                  </button>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-[1px] border border-border-4 text-muted"
                    style={{ textDecoration: 'none' }}
                  >
                    View Article ↗
                  </a>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-4">
                {visibleItems.length} article{visibleItems.length === 1 ? '' : 's'} · page{' '}
                {currentPage + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(0, p - 1));
                  }}
                  disabled={currentPage === 0}
                  className="font-mono text-[10px] px-2.5 py-1 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => {
                    setPage((p) => Math.min(pageCount - 1, p + 1));
                  }}
                  disabled={currentPage >= pageCount - 1}
                  className="font-mono text-[10px] px-2.5 py-1 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {failedTickers.length > 0 && (
        <p className="font-mono text-[10px] text-muted-4">
          Could not fetch news for: {failedTickers.join(', ')}.
        </p>
      )}

      {modalItem !== undefined && (
        <ResearchUpdateModal
          open
          onClose={() => {
            setModalItem(undefined);
          }}
          item={modalItem}
          domain={domain}
          dataset={researchDataset}
          onSuccess={onResearchUpdated}
        />
      )}

      <ManageTickersModal
        open={manageTickersOpen}
        onClose={() => {
          setManageTickersOpen(false);
        }}
        domain={domain}
        tickers={feeds.map((f) => ({ ticker: f.ticker, companyName: f.companyName }))}
        onChanged={refetch}
      />

      {newsAgentOpen && (
        <NewsAgentModal
          open
          onClose={() => {
            setNewsAgentOpen(false);
          }}
          domain={domain}
          onSuccess={onResearchUpdated}
        />
      )}
    </div>
  );
}
