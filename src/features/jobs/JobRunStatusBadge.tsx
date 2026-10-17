/** Mirrors `stock-bots-ui`'s `JobStatusBadge` — a bordered, background-tinted box, not the rest
 * of this app's dot-style `StatusPill` — kept distinct on purpose for the run-history table this
 * backs, to match that reference design closely. Only two real states exist for a COMPLETED run
 * (unlike the template's `idle`/`queued`/`running`/`partial`, which described a job's CURRENT
 * live status, not a past run's outcome — `JobCard`'s own "RUNNING…" button label already covers
 * the live case). */
export default function JobRunStatusBadge({ ok }: { ok: boolean }) {
  const color = ok ? 'var(--color-accent)' : 'var(--color-danger)';
  return (
    <span
      className="font-mono text-[9px] font-bold px-1.5 py-0.5"
      style={{
        color,
        // `color-mix` (not the original design's `color + "44"` string concatenation, which only
        // works on a literal hex string, never a `var()` reference) so this stays tied to the
        // real token rather than a hardcoded hex duplicate of it.
        border: `1px solid color-mix(in srgb, ${color} 27%, transparent)`,
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
        borderRadius: 2,
        letterSpacing: '0.08em',
      }}
    >
      {ok ? 'OK' : 'FAILED'}
    </span>
  );
}
