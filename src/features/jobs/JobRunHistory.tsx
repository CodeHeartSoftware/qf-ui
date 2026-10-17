import type { JobRun } from '@/hooks/apiTypes';
import JobRunHistoryRow from './JobRunHistoryRow';

/** Mirrors `stock-bots-ui`'s "Run History" table — a bordered box, an uppercase header row on
 * `bg-surface-3`, then one `JobRunHistoryRow` per past run — dropped down to the columns this
 * job model actually has (no fabricated rows/bytes metrics; see that component's own comment).
 * Purely presentational: `JobCard` owns the actual fetch (`useJobRunHistory`), so the same data
 * backs both this table and the always-visible spark row without two separate requests. */
export default function JobRunHistory({
  runs,
  loading,
  error,
}: {
  runs: JobRun[];
  loading: boolean;
  error: string | undefined;
}) {
  if (loading) return <p className="font-mono text-[10px] text-muted-4">Loading history…</p>;
  if (error !== undefined) {
    return <p className="font-mono text-[10px] text-danger">{error}</p>;
  }
  if (runs.length === 0) {
    return <p className="font-mono text-[10px] text-muted-4">No recorded runs yet.</p>;
  }

  return (
    <div className="border border-border-3 rounded-[2px] overflow-hidden">
      <div
        className="grid font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 bg-surface-3 text-muted-3 border-b border-border-3"
        style={{ gridTemplateColumns: '140px 60px 70px 1fr' }}
      >
        <span>Started</span>
        <span>Status</span>
        <span>Duration</span>
        <span>Summary</span>
      </div>
      {runs.map((run, i) => (
        <JobRunHistoryRow key={run.id} run={run} isLast={i === runs.length - 1} />
      ))}
    </div>
  );
}
