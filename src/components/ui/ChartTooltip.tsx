import type { TooltipProps } from 'recharts';

export default function ChartTooltip({
  active,
  payload,
  label,
  showSign = true,
}: TooltipProps<number, string> & {
  /** Whether to prefix a positive value with "+" — meaningful for a P&L/delta series (a gain),
   * misleading for a plain magnitude series (e.g. a $20,000 position isn't a "+$20,000 gain") —
   * see `BotDetailPanel`'s "Position Value by Ticker" and `MatchLeaderboard`'s "Equity by Bot",
   * both of which pass `showSign={false}`. Defaults to `true` so every existing delta chart
   * (Cumulative P&L) needs no change. */
  showSign?: boolean;
}) {
  if (active !== true || payload === undefined || payload.length === 0) return null;
  return (
    <div className="bg-surface-3 border border-border rounded" style={{ padding: '8px 12px' }}>
      <p className="font-mono text-[10px] mb-1 text-muted-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-xs" style={{ color: p.color }}>
          {p.name}: {showSign && typeof p.value === 'number' && p.value > 0 ? '+' : ''}
          {typeof p.value === 'number'
            ? p.value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              })
            : p.value}
        </p>
      ))}
    </div>
  );
}
