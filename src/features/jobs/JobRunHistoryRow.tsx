import type { JobRun } from '@/hooks/apiTypes';
import JobRunStatusBadge from './JobRunStatusBadge';

/** Whole seconds/minutes, matching `stock-bots-ui`'s own `formatDuration` style — but computed
 * from our two real timestamps rather than trusting a separately-recorded duration field, since
 * this job model doesn't have one. */
function formatRunDuration(startedAt: string, finishedAt: string): string {
  const seconds = (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 1) return '<1s';
  if (seconds >= 60)
    return `${String(Math.floor(seconds / 60))}m ${String(Math.round(seconds % 60))}s`;
  return `${String(Math.round(seconds))}s`;
}

/** Mirrors `stock-bots-ui`'s `JobHistoryRow` layout (a fixed-width grid: started/status/duration,
 * then a flexible trailing column) — but that column is this job's own real `summary` (what the
 * action itself reported), not fabricated "rows out"/"bytes written" metrics this job model has
 * no equivalent of. */
export default function JobRunHistoryRow({ run, isLast }: { run: JobRun; isLast: boolean }) {
  return (
    <div
      className={`grid items-center px-3 py-2 bg-surface ${isLast ? '' : 'border-b border-surface-3'}`}
      style={{ gridTemplateColumns: '140px 60px 70px 1fr' }}
    >
      <span className="font-mono text-[9px] text-muted">
        {run.startedAt.slice(0, 16).replace('T', ' ')}
      </span>
      <JobRunStatusBadge ok={run.ok} />
      <span className="font-mono text-[9px] text-muted">
        {formatRunDuration(run.startedAt, run.finishedAt)}
      </span>
      <span
        className={`font-mono text-[9px] truncate ${run.ok ? 'text-muted-3' : 'text-danger'}`}
        title={run.summary}
      >
        {run.summary}
      </span>
    </div>
  );
}
