import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';
import Metric from '@/components/ui/Metric';
import { useForwardMatch } from '@/hooks/useForwardMatch';
import { formatPercent, formatSharpe, formatUsdCents } from '@/utils/format';
import PinStatusBadges from './PinStatusBadges';

/** One forward match's own leaderboard — equity/return/Sharpe are only meaningfully comparable
 * WITHIN a match (same starting capital, dataset, and universe), never summed across separate
 * matches, so the dashboard renders one of these per active match rather than one fleet-wide
 * total (the original template's `aggregate.ts` did the latter, but only because every bot there
 * shared one fake, globally-comparable P&L series). */
export default function MatchLeaderboard({ matchId }: { matchId: string }) {
  const { match, error, loading } = useForwardMatch(matchId);

  if (loading) return <p className="font-mono text-xs text-muted-3">Loading {matchId}…</p>;
  if (error !== undefined) return <p className="font-mono text-xs text-danger">{error}</p>;
  if (match === undefined) return null;

  const standings = [...match.standings.standings].sort((a, b) => a.rank - b.rank);
  const avgEquityCents =
    standings.length > 0 ? standings.reduce((s, p) => s + p.equityCents, 0) / standings.length : 0;
  const avgReturn =
    standings.length > 0 ? standings.reduce((s, p) => s + p.totalReturn, 0) / standings.length : 0;
  const avgSharpe =
    standings.length > 0
      ? standings.reduce((s, p) => s + (p.sharpeRatio ?? 0), 0) / standings.length
      : 0;
  const avgMaxDrawdown =
    standings.length > 0 ? standings.reduce((s, p) => s + p.maxDrawdown, 0) / standings.length : 0;
  const chartData = standings.map((p) => ({
    participant: p.participantId,
    equity: p.equityCents / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold text-foreground">{matchId}</h3>
          <p className="font-mono text-[10px] text-muted-3">
            As of {match.standings.asOfDate ?? '—'} · {match.roundsPlayed} trading day(s) played ·{' '}
            {match.status}
          </p>
        </div>
        {match.status === 'active' && <PinStatusBadges matchId={matchId} />}
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px"
        style={{
          background: 'var(--color-border-3)',
          border: '1px solid var(--color-border-3)',
          borderRadius: 2,
        }}
      >
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric label="Participants" value={String(standings.length)} />
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric
            label="Avg Equity"
            value={formatUsdCents(avgEquityCents)}
            subValue={`${avgReturn >= 0 ? '+' : ''}${formatPercent(avgReturn)}`}
            subAccent={avgReturn >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
          />
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric
            label="Avg Sharpe"
            value={avgSharpe.toFixed(2)}
            accent={
              avgSharpe >= 1.5
                ? 'var(--color-accent)'
                : avgSharpe >= 1
                  ? 'var(--color-warning)'
                  : 'var(--color-danger)'
            }
          />
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric
            label="Avg Max Drawdown"
            value={formatPercent(avgMaxDrawdown)}
            accent="var(--color-danger)"
          />
        </div>
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-3)',
          borderRadius: 2,
          padding: 24,
        }}
      >
        <p className="font-mono text-[10px] tracking-widest uppercase mb-6 text-muted-3">
          Equity by Model
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--color-surface-2)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="participant"
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: 'var(--color-muted-3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: 'var(--color-muted-3)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<ChartTooltip showSign={false} />} />
            <Bar dataKey="equity" name="Equity" fill="var(--color-accent)" radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{ border: '1px solid var(--color-border-3)', borderRadius: 2, overflow: 'hidden' }}
      >
        <div
          className="grid font-mono text-[9px] tracking-widest uppercase px-4 py-2"
          style={{
            gridTemplateColumns: '40px 1fr 90px 80px 70px 90px',
            background: 'var(--color-surface-3)',
            color: 'var(--color-muted-3)',
          }}
        >
          <span>Rank</span>
          <span>Model</span>
          <span>Equity</span>
          <span>Return</span>
          <span>Sharpe</span>
          <span>Max DD</span>
        </div>
        {standings.map((p, i) => (
          <div
            key={p.participantId}
            className="grid items-center px-4 py-2.5 gap-2 font-mono text-xs"
            style={{
              gridTemplateColumns: '40px 1fr 90px 80px 70px 90px',
              background: i % 2 === 0 ? 'var(--color-surface)' : '#0b0b0b',
              color: '#ccc',
            }}
          >
            <span className="text-muted-3">#{p.rank}</span>
            <span className="truncate">{p.participantId}</span>
            <span>{formatUsdCents(p.equityCents)}</span>
            <span
              style={{ color: p.totalReturn >= 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}
            >
              {formatPercent(p.totalReturn)}
            </span>
            <span>{formatSharpe(p.sharpeRatio)}</span>
            <span style={{ color: 'var(--color-danger)' }}>{formatPercent(p.maxDrawdown)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
