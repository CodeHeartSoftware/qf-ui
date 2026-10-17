import Tag from '@/components/ui/Tag';
import type { DatasetFreshness, TickerFreshnessStatus } from '@/hooks/apiTypes';

const STATUS_COLOR: Record<TickerFreshnessStatus, string> = {
  current: 'var(--color-accent)',
  behind: 'var(--color-warning)',
  'no-bars': 'var(--color-danger)',
  unmapped: 'var(--color-muted-3)',
};

export default function DatasetFreshnessCard({ dataset }: { dataset: DatasetFreshness }) {
  return (
    <div className="bg-surface border border-border-2 rounded-[2px] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2">
        <div>
          <h3 className="font-mono text-sm font-semibold text-foreground">{dataset.id}</h3>
          <p className="font-mono text-[10px] text-muted-3">version {dataset.version}</p>
        </div>
        <span className="font-mono text-[10px] text-muted-2">
          latest known: {dataset.latestKnownDate ?? '—'}
        </span>
      </div>
      <div className="flex flex-col">
        {dataset.tickers.map((t, i) => (
          <div
            key={t.ticker}
            className="flex items-center justify-between px-5 py-2 font-mono text-xs"
            style={{ borderTop: i === 0 ? 'none' : '1px solid #151515' }}
          >
            <span className="text-muted-2">{t.ticker}</span>
            <span className="flex items-center gap-2">
              <span className="text-muted-3">{t.latestKnownDate ?? 'no bars'}</span>
              <Tag label={t.status.toUpperCase()} color={STATUS_COLOR[t.status]} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
