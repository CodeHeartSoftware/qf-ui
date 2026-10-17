import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';
import Metric from '@/components/ui/Metric';
import { formatPercent, formatSharpe, formatUsdCents } from '@/utils/format';
import type { BotSummary, Fill, PositionObservation } from '@/hooks/apiTypes';
import type { BotPerformanceEntry } from './useBotPerformance';

/** Every ticker the bot is ALLOWED to trade (its match's own tracked-security universe), not
 * just the ones it currently holds a nonzero position in — `standing.positions` only ever lists
 * real holdings, so a ticker it's sitting out entirely would otherwise be silently missing from
 * the chart/breakdown below rather than shown as a real, deliberate zero. Falls back to the real
 * positions alone if the universe wasn't reported (e.g. a non-FORWARD_SHADOW match). */
function withFullUniverse(
  universe: string[],
  positions: PositionObservation[],
): PositionObservation[] {
  if (universe.length === 0) return positions;
  const byTicker = new Map(positions.map((p) => [p.ticker, p]));
  return universe.map(
    (ticker) =>
      byTicker.get(ticker) ?? {
        ticker,
        shares: 0,
        averageEntryPriceCents: 0,
        realizedPnlCents: 0,
        marketValueCents: 0,
        unrealizedPnlCents: 0,
      },
  );
}

/** A `filledQuantity === 0` row is a deliberate, honest record from `resolveOrdersForPortfolio`
 * (`games/stock-market-4`'s execution engine) — an order it could NOT execute at all still gets a
 * `Fill` entry rather than vanishing silently (e.g. a ticker with no price bar that day: a
 * cross-listed name with its own exchange holidays, or a real market-data gap). `priceCents === 0`
 * specifically means "no reference price was available to fill against at all" — a `MARKET` order
 * (unlike `LIMIT`) always resolves a real reference price when a bar exists, so `0` here can only
 * come from that no-bar case, never from "the security is genuinely worth $0." A nonzero
 * `priceCents` alongside a zero `filledQuantity` is a different, mundane case instead (order size
 * capped to zero — e.g. a SELL against a position it doesn't actually hold, or a BUY it can't
 * afford) and is labeled accordingly, rather than both being shown as an indistinguishable "0 sh
 * $0.00" that reads exactly like a completed zero-value trade. */
function notFilledReason(f: Fill): string {
  return f.priceCents === 0
    ? `not filled — no price data this trading day (requested ${String(f.requestedQuantity)} sh)`
    : `not filled — 0 of ${String(f.requestedQuantity)} sh`;
}

/** Shared row rendering for both fills subsections below — same data shape, just a different
 * round's worth of it. */
function FillsList({ fills }: { fills: Fill[] }) {
  if (fills.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-4">No fills recorded for this trading day.</p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {fills.map((f, i) => {
        const notFilled = f.filledQuantity === 0;
        return (
          <div
            key={`${f.ticker}-${String(i)}`}
            className="flex items-center justify-between font-mono text-xs"
          >
            <span className="text-muted-2 w-28 shrink-0 truncate">{f.ticker}</span>
            <span
              className="w-12 shrink-0"
              style={{
                color: f.side === 'BUY' ? 'var(--color-accent)' : 'var(--color-danger)',
                opacity: notFilled ? 0.5 : 1,
              }}
            >
              {f.side}
            </span>
            {notFilled ? (
              <span className="text-muted-4 italic flex-1 text-right">{notFilledReason(f)}</span>
            ) : (
              <>
                <span className="text-muted-3 flex-1 text-right">{f.filledQuantity} sh</span>
                <span className="text-muted-2 w-20 text-right">{formatUsdCents(f.priceCents)}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** One match entry for the currently-switched-to bot — laid out to mirror `stock-bots-ui`'s
 * original `PortfolioDashboard` (KPI row -> one big chart -> a two-column breakdown row -> a
 * themed callout at the bottom), just built from this bot's real standing instead of simulated
 * fleet data. A bot with more than one active match renders one of these per match (never
 * combined into one number; see `useBotPerformance`'s doc comment for why). */
function BotMatchSection({ entry }: { entry: BotPerformanceEntry }) {
  const { matchId, standing, marketDataUniverse, equityHistory } = entry;
  const positions = withFullUniverse(marketDataUniverse, standing.positions);
  // Plots unrealized P&L, not market value — a position's market value can't go negative for a
  // long holding, so a "red = losing" bar could never actually dip below the zero axis on its
  // own; P&L is the real signed quantity where a loss IS a negative number, so the chart's
  // direction and its (already P&L-based) color always agree.
  const positionChartData = positions.map((p) => ({
    ticker: p.ticker,
    value: p.unrealizedPnlCents / 100,
  }));
  // `standing.positions` (before the full-universe fill above) already carries a row for every
  // ticker the bot has EVER traded, including ones it has since fully sold out of (`shares: 0`,
  // kept only so `realizedPnlCents` isn't lost) — real for "value by ticker over time," but
  // meaningless clutter for "what does this bot currently hold," so the breakdown panel below and
  // the "N open positions" callout both filter down to actual current exposure.
  const openPositions = positions.filter((p) => p.shares !== 0);
  // Cash + the sum of every open position's market value is, by construction, exactly
  // `standing.equityCents` — shown explicitly below ("Total Equity") so the reconciliation is
  // visible, not just implied.
  const positionsTotalCents = openPositions.reduce((sum, p) => sum + p.marketValueCents, 0);
  const totalUnrealizedPnlCents = openPositions.reduce((sum, p) => sum + p.unrealizedPnlCents, 0);
  const maxAbsMarketValueCents = Math.max(
    ...openPositions.map((p) => Math.abs(p.marketValueCents)),
    1,
  );

  // Cumulative P&L relative to the match's own starting equity (round 0) — real, per-round
  // history read straight off the resumed game state (see the API route's own comment), not
  // derived/estimated from the current snapshot.
  const startingEquityCents = equityHistory[0]?.equityCents ?? standing.equityCents;
  const pnlSeries = equityHistory.map((point) => ({
    date: point.date,
    cumulative: (point.equityCents - startingEquityCents) / 100,
  }));
  const finalCumulative = pnlSeries[pnlSeries.length - 1]?.cumulative ?? 0;
  const pnlColor = finalCumulative >= 0 ? 'var(--color-accent)' : 'var(--color-danger)';
  const pnlXAxisInterval = Math.max(0, Math.floor(pnlSeries.length / 8));

  return (
    <div className="flex flex-col gap-6">
      {/* themed callout — real match context, not a fabricated recommendation */}
      <div
        style={{
          background: 'var(--color-accent-subtle-bg)',
          border: '1px solid var(--color-accent-subtle-border)',
          borderRadius: 2,
          padding: 24,
        }}
      >
        <p
          className="font-mono text-[10px] tracking-widest uppercase mb-4"
          style={{ color: '#1a5533' }}
        >
          Simulation Snapshot
        </p>
        <p
          className="font-mono text-sm leading-relaxed"
          style={{ color: 'var(--color-accent-subtle-text)' }}
        >
          Rank #{standing.rank} in {matchId}, {openPositions.length} open position
          {openPositions.length === 1 ? '' : 's'}. Cash reserve of{' '}
          {formatUsdCents(standing.cashCents)} against {formatUsdCents(standing.equityCents)} total
          equity, annualized volatility of {formatPercent(standing.annualizedVolatility)}.
        </p>
      </div>
      <p className="font-mono text-[10px] text-muted-3">
        {matchId} · rank #{standing.rank}
      </p>

      {/* KPI row */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px"
        style={{
          background: 'var(--color-border-3)',
          border: '1px solid var(--color-border-3)',
          borderRadius: 2,
        }}
      >
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric label="Equity" value={formatUsdCents(standing.equityCents)} />
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric
            label="Total Return"
            value={formatPercent(standing.totalReturn)}
            accent={standing.totalReturn >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
          />
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
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
        </div>
        <div className="flex flex-col gap-2 p-5 bg-surface">
          <Metric
            label="Max Drawdown"
            value={formatPercent(standing.maxDrawdown)}
            accent="var(--color-danger)"
          />
        </div>
      </div>

      {/* cumulative P&L over rounds */}
      {pnlSeries.length > 1 && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
            padding: 24,
          }}
        >
          <p className="font-mono text-[10px] tracking-widest uppercase mb-6 text-muted-3">
            Cumulative P&amp;L — {matchId} ({pnlSeries.length} trading days)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pnlSeries} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id={`pnl-grad-${matchId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pnlColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={pnlColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-surface-2)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'var(--color-muted-3)' }}
                axisLine={false}
                tickLine={false}
                interval={pnlXAxisInterval}
              />
              <YAxis
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'var(--color-muted-3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative P&L"
                stroke={pnlColor}
                strokeWidth={2}
                fill={`url(#pnl-grad-${matchId})`}
                dot={false}
                activeDot={{ r: 4, fill: pnlColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* unrealized P&L by ticker */}
      {positionChartData.length > 0 && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
            padding: 24,
          }}
        >
          <p className="font-mono text-[10px] tracking-widest uppercase mb-6 text-muted-3">
            Unrealized P&amp;L by Ticker
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={positionChartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="var(--color-surface-2)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="ticker"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'var(--color-muted-3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: 'var(--color-muted-3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  `${v < 0 ? '-' : ''}$${(Math.abs(v) / 1000).toFixed(1)}k`
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="3 3" />
              <Bar dataKey="value" name="Unrealized P&L" radius={[1, 1, 0, 0]}>
                {positionChartData.map((d) => (
                  <Cell
                    key={d.ticker}
                    fill={d.value >= 0 ? 'var(--color-accent)' : 'var(--color-danger)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* two-column breakdown row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
            padding: 24,
          }}
        >
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3">
            This Trading Day's Fills
          </p>
          <p className="font-mono text-[10px] mb-4 text-muted-4">
            What this model did in the most recently resolved trading day.
          </p>
          <FillsList fills={standing.lastFills} />

          <p
            className="font-mono text-[10px] tracking-widest uppercase text-muted-3 mt-6 pt-4"
            style={{ borderTop: '1px solid var(--color-surface-2)' }}
          >
            Last Trading Day's Fills
          </p>
          {/* The engine only ever retains ONE round's worth of "the round before this one" — each
              new round shifts it forward rather than accumulating a ledger (see
              `StockMarket4State.previousFills`'s own doc comment) — so there's still no multi-round
              history to show here, just one more round of it than before. */}
          <p className="font-mono text-[10px] mb-4 text-muted-4">
            What this model did the trading day before that — not a full history.
          </p>
          <FillsList fills={standing.previousFills} />
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
            padding: 24,
          }}
        >
          <p className="font-mono text-[10px] tracking-widest uppercase mb-4 text-muted-3">
            Position Breakdown
          </p>
          {openPositions.length === 0 ? (
            <p className="font-mono text-xs text-muted-4">No open positions.</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {openPositions.map((p) => {
                  const pct = (Math.abs(p.marketValueCents) / maxAbsMarketValueCents) * 100;
                  const color =
                    p.unrealizedPnlCents >= 0 ? 'var(--color-accent)' : 'var(--color-danger)';
                  return (
                    <div key={p.ticker} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] w-16 shrink-0 truncate text-muted">
                        {p.ticker}
                      </span>
                      <div
                        className="flex-1 h-[3px] rounded-full"
                        style={{ background: 'var(--color-border-3)' }}
                      >
                        <div
                          style={{
                            width: `${String(pct)}%`,
                            background: color,
                            height: '100%',
                            borderRadius: 9999,
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-xs w-20 text-right"
                        style={{ color, fontWeight: 600 }}
                      >
                        {formatUsdCents(p.marketValueCents)}
                      </span>
                    </div>
                  );
                })}
                <div
                  className="flex items-center justify-between pt-2 mt-1"
                  style={{ borderTop: '1px solid var(--color-surface-2)' }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-3">
                    Total
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {formatUsdCents(positionsTotalCents)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-surface-2)' }}>
                <p className="font-mono text-[10px] tracking-widest uppercase mb-3 text-muted-3">
                  Unrealized P&amp;L
                </p>
                {openPositions.map((p) => (
                  <div key={p.ticker} className="flex items-center justify-between py-1">
                    <span className="font-mono text-[10px] text-muted-2">{p.ticker}</span>
                    <span
                      className="font-mono text-xs"
                      style={{
                        color:
                          p.unrealizedPnlCents >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                        fontWeight: 600,
                      }}
                    >
                      {formatUsdCents(p.unrealizedPnlCents)}
                    </span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between pt-2 mt-1"
                  style={{ borderTop: '1px solid var(--color-surface-2)' }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-3">
                    Total
                  </span>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{
                      color:
                        totalUnrealizedPnlCents >= 0
                          ? 'var(--color-accent)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {formatUsdCents(totalUnrealizedPnlCents)}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-surface-2)' }}>
            <p className="font-mono text-[10px] tracking-widest uppercase mb-3 text-muted-3">
              Total Equity
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-2">Cash</span>
                <span className="font-mono text-xs text-muted">
                  {formatUsdCents(standing.cashCents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-2">
                  Positions ({openPositions.length})
                </span>
                <span className="font-mono text-xs text-muted">
                  {formatUsdCents(positionsTotalCents)}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2 mt-1"
                style={{ borderTop: '1px solid var(--color-border-3)' }}
              >
                <span />
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {formatUsdCents(standing.equityCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renders exactly the match currently picked in `BotMatchSwitcher` — a bot in more than one
 * active match no longer stacks every match's section at once; the switcher chooses which one. */
export default function BotDetailPanel({
  bot,
  entry,
}: {
  bot: BotSummary;
  entry: BotPerformanceEntry | undefined;
}) {
  if (entry === undefined) {
    return (
      <p className="font-mono text-xs text-muted-3">
        {bot.name} isn't part of an active forward simulation right now.
      </p>
    );
  }
  return <BotMatchSection entry={entry} />;
}
