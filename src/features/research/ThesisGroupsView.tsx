import Tag from '@/components/ui/Tag';
import { useThesisGroups } from '@/hooks/useQuantAnalysis';
import { colorForSlug } from '@/utils/format';

/** Which tracked tickers `@quant-fusion/quant-sdk-js`'s own `groupByThesisOverlap` — the SAME
 * function the risk engine's `applyThesisGroupCaps` uses — currently treats as one underlying
 * commercialization bet rather than genuinely independent positions, based on shared research
 * exposure footprint (never price correlation, which needs real historical returns this view
 * doesn't try to reproduce — this is the causal/research half only). A ticker with no meaningful
 * overlap with anything lands in its own singleton group, which is the common, expected case, not
 * a bug. */
export default function ThesisGroupsView({ domain }: { domain: string }) {
  const { thesisGroups, error, loading } = useThesisGroups(domain);

  if (loading) {
    return <p className="font-mono text-xs text-muted-3">Computing thesis groups…</p>;
  }
  if (error !== undefined) {
    return <p className="font-mono text-xs text-danger">{error}</p>;
  }
  if (thesisGroups === undefined) return null;

  const { groups, pairwiseOverlap, unresolvedTickers } = thesisGroups;
  const multiMemberGroups = groups.filter((g) => g.length > 1);
  const singletons = groups.filter((g) => g.length === 1).flat();

  return (
    <div
      className="p-4 flex flex-col gap-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          {multiMemberGroups.length === 0 ? (
            <p className="font-mono text-xs text-muted-4">
              No two tracked tickers currently share enough research exposure to be grouped.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                Correlated Groups
              </span>
              {multiMemberGroups.map((group) => (
                <div
                  key={group.join('-')}
                  className="p-3 flex items-center gap-2 flex-wrap"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border-4)',
                    borderRadius: 2,
                  }}
                >
                  {group.map((ticker) => (
                    <Tag key={ticker} label={ticker} color={colorForSlug(ticker)} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {singletons.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                No Meaningful Overlap
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {singletons.map((ticker) => (
                  <Tag key={ticker} label={ticker} color={colorForSlug(ticker)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {pairwiseOverlap.length > 0 && (
            <>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                Pairwise Causal Overlap
              </span>
              {pairwiseOverlap.map((p) => (
                <div
                  key={`${p.tickerA}-${p.tickerB}`}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-[11px] text-muted">
                    {p.tickerA} ↔ {p.tickerB}
                  </span>
                  <span className="font-mono text-[11px] text-muted-2">{p.overlap.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {unresolvedTickers.length > 0 && (
        <p className="font-mono text-[10px] text-muted-4">
          Not analyzed (no matching research entity yet): {unresolvedTickers.join(', ')}.
        </p>
      )}
    </div>
  );
}
