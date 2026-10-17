import type { JobRun } from '@/hooks/apiTypes';

/** Mirrors `stock-bots-ui`'s `HistorySparkRow` — a compact, always-visible strip of small colored
 * bars, oldest to newest, one per recent run — so a job's health is readable at a glance without
 * expanding anything. Only two real colors (unlike the template's added "partial" amber state,
 * which this job model has no equivalent of — a run either succeeded or it didn't). */
export default function JobRunHistorySpark({ runs }: { runs: JobRun[] }) {
  const recent = [...runs].reverse().slice(-10);
  return (
    <div className="flex items-center gap-0.5">
      {recent.map((run) => (
        <div
          key={run.id}
          title={`${run.startedAt} — ${run.ok ? 'OK' : 'FAILED'}`}
          style={{
            width: 6,
            height: 18,
            background: `color-mix(in srgb, ${run.ok ? 'var(--color-accent)' : 'var(--color-danger)'} 55%, transparent)`,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
