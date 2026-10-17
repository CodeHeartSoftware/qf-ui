export type StatusTone = 'accent' | 'info' | 'muted' | 'danger' | 'warning';

const TONE_COLORS: Record<StatusTone, string> = {
  accent: 'var(--color-accent)',
  info: 'var(--color-info)',
  muted: 'var(--color-muted-3)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
};

/** A small inline status dot + label — the generalized form of the original template's
 * fleet-only `StatusDot` (bot run status), now also covering forward-match status and
 * market-data freshness, which aren't "is a bot running" states. */
export default function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const color = TONE_COLORS[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={tone === 'accent' ? 'animate-pulse-dot' : ''}
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </span>
  );
}
