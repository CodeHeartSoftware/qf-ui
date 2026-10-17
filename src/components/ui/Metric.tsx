export default function Metric({
  label,
  value,
  accent,
  subValue,
  subAccent,
}: {
  label: string;
  value: string;
  accent?: string;
  /** An optional second, smaller line under `value` — e.g. a % change alongside a dollar figure
   * (see `MatchLeaderboard`'s "Avg Equity" cell). */
  subValue?: string;
  subAccent?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-2">{label}</span>
      <span
        className="font-mono text-sm font-semibold"
        style={{ color: accent ?? 'var(--color-foreground)' }}
      >
        {value}
        {subValue !== undefined && (
          <span
            className="font-mono text-xs"
            style={{ color: subAccent ?? 'var(--color-muted-2)' }}
          >
            {` (${subValue})`}
          </span>
        )}
      </span>
    </div>
  );
}
