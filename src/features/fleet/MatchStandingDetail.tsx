import { useForwardMatch } from '@/hooks/useForwardMatch';
import Metric from '@/components/ui/Metric';
import { formatPercent, formatSharpe, formatUsdCents } from '@/utils/format';

/** Fetched only once a `BotCard`'s match row is expanded — one `resumeForwardState` +
 * `getCurrentStandings` call (no Docker) per expand, not one per bot card up front. */
export default function MatchStandingDetail({
  matchId,
  participantId,
}: {
  matchId: string;
  participantId: string;
}) {
  const { match, error, loading } = useForwardMatch(matchId);

  if (loading) {
    return <p className="font-mono text-[10px] text-muted-3 px-5 pb-4">Loading standings…</p>;
  }
  if (error !== undefined) {
    return <p className="font-mono text-[10px] text-danger px-5 pb-4">{error}</p>;
  }
  const standing = match?.standings.standings.find((s) => s.participantId === participantId);
  if (standing === undefined) {
    return (
      <p className="font-mono text-[10px] text-muted-3 px-5 pb-4">
        No standing recorded for this model in this simulation yet.
      </p>
    );
  }

  return (
    <div className="px-5 pb-5 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Equity" value={formatUsdCents(standing.equityCents)} />
        <Metric
          label="Total Return"
          value={formatPercent(standing.totalReturn)}
          accent={standing.totalReturn >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
        />
        <Metric
          label="Sharpe"
          value={formatSharpe(standing.sharpeRatio)}
          accent={
            standing.sharpeRatio !== null && standing.sharpeRatio >= 1.5
              ? 'var(--color-accent)'
              : standing.sharpeRatio !== null && standing.sharpeRatio >= 1
                ? 'var(--color-warning)'
                : 'var(--color-danger)'
          }
        />
        <Metric label="Cash" value={formatUsdCents(standing.cashCents)} />
        <Metric
          label="Max Drawdown"
          value={formatPercent(standing.maxDrawdown)}
          accent="var(--color-danger)"
        />
        <Metric label="Rank" value={`#${String(standing.rank)}`} />
      </div>

      {standing.positions.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-2 text-muted-3">
            Positions ({standing.positions.length})
          </p>
          <div className="flex flex-col gap-1">
            {standing.positions.map((p) => (
              <div
                key={p.ticker}
                className="flex items-center justify-between font-mono text-[11px]"
              >
                <span className="text-muted-2">
                  {p.ticker} × {p.shares}
                </span>
                <span
                  style={{
                    color:
                      p.unrealizedPnlCents >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                  }}
                >
                  {formatUsdCents(p.marketValueCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
