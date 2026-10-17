import { useMarketDataStatus } from '@/hooks/useMarketDataStatus';
import { useMarketUniverses } from '@/hooks/useMarketUniverses';
import DailyCycleHistory from './DailyCycleHistory';
import JobCard from './JobCard';
import type { JobDefinition } from './jobs';

/** Mirrors `stock-bots-ui`'s `JobsPanel` (KPI strip -> job cards), scaled down to the one real
 * kind of batch job this app actually has a script for (see `jobs.ts`'s own doc comment on why
 * the registry is deliberately small) rather than the template's invented multi-category job
 * board. "Fetch Latest Price Data" is now one job PER registered market universe
 * (`useMarketUniverses`) — today just the fusion portfolio, but a second game's universe shows up
 * here as its own card the moment it's registered, no code change needed. Actually kicking off a
 * job from here is Phase B (see ADR-0015 and `JobCard`'s "Run Now") — this tab surfaces real
 * data-freshness visibility today, the same per-ticker computation `apps/cli`'s `match forward
 * status` performs. */
export default function JobsPanel() {
  const { datasets, research, error: statusError, loading: statusLoading } = useMarketDataStatus();
  const { universes, error: universesError, loading: universesLoading } = useMarketUniverses();

  if (statusLoading || universesLoading) {
    return <p className="font-mono text-xs text-muted-3">Checking data freshness…</p>;
  }
  const error = statusError ?? universesError;
  if (error !== undefined) return <p className="font-mono text-xs text-danger">{error}</p>;

  const jobs: (JobDefinition & { relevantDatasets: typeof datasets })[] = universes.map(
    (universe) => ({
      id: `market-data-fetch-${universe.id}`,
      name: `Fetch Latest Price Data — ${universe.label}`,
      category: 'market-data',
      description:
        `Fetches daily OHLCV bars for ${universe.label}'s ${String(universe.tickers.length)} ` +
        `tracked tickers (${universe.game}) from Yahoo Finance and appends them to the ` +
        'market-data store — the same fetch `quant-fusion match forward refresh` runs before ' +
        'resuming a simulation.',
      source: 'Yahoo Finance',
      output: 'market-data (SQLite)',
      runPath: `/api/market-data/fetch/${universe.id}`,
      jobId: universe.jobId,
      relevantDatasets: datasets.filter((d) => d.id === universe.datasetId),
    }),
  );

  const totalTickers = datasets.flatMap((d) => d.tickers).length;
  const staleTickers = datasets
    .flatMap((d) => d.tickers)
    .filter((t) => t.status !== 'current').length;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px border rounded-[2px]"
        style={{ background: 'var(--color-border-3)', borderColor: 'var(--color-border-3)' }}
      >
        {[
          { label: 'Total Jobs', value: String(jobs.length), color: 'var(--color-foreground)' },
          {
            label: 'Datasets Tracked',
            value: String(datasets.length),
            color: 'var(--color-info)',
          },
          {
            label: 'Tickers Tracked',
            value: String(totalTickers),
            color: 'var(--color-foreground)',
          },
          {
            label: 'Stale Tickers',
            value: String(staleTickers),
            color: staleTickers > 0 ? 'var(--color-warning)' : 'var(--color-muted-3)',
          },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-1 p-4 bg-surface">
            <span className="font-mono text-[9px] tracking-widest uppercase text-muted-3">
              {m.label}
            </span>
            <span className="font-mono text-xl font-bold" style={{ color: m.color }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* job cards */}
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} datasets={job.relevantDatasets} />
        ))}
      </div>

      <DailyCycleHistory />

      {research !== undefined && (
        <div className="bg-surface border border-border-2 rounded-[2px] flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-semibold text-foreground">Research Dataset</h3>
            <p className="font-mono text-[10px] text-muted-3">{research.datasetId}</p>
          </div>
          <span className="font-mono text-[10px] text-muted-2">
            latest known development: {research.latestKnownDate ?? '—'}
          </span>
        </div>
      )}
    </div>
  );
}
