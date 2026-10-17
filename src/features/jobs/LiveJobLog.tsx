import type { LiveJob, LiveJobStatus } from '@/hooks/apiTypes';
import { useLiveJob } from '@/hooks/useLiveJob';
import { useAutoScroll } from './useAutoScroll';

const STATUS_STYLE: Record<LiveJobStatus, { label: string; color: string }> = {
  running: { label: 'RUNNING…', color: 'var(--color-info)' },
  succeeded: { label: 'DONE', color: 'var(--color-accent)' },
  failed: { label: 'FAILED', color: 'var(--color-danger)' },
};

/** Self-polling variant — for a caller that doesn't otherwise need the job's state. */
export default function LiveJobLog({ jobId }: { jobId: string }) {
  return <LiveJobLogView {...useLiveJob(jobId)} />;
}

/** One live job's streaming log (see `useLiveJob`) — status, one-line summary once finished, and
 * the raw combined output, auto-scrolling as it grows. Survives the API restarting mid-job (shows
 * "reconnecting" instead of an error). */
export function LiveJobLogView({
  job,
  reconnecting,
  notFound,
}: {
  job: LiveJob | undefined;
  reconnecting: boolean;
  notFound: boolean;
}) {
  const logRef = useAutoScroll<HTMLPreElement>(job?.output.length ?? 0);

  if (notFound) {
    return (
      <p className="font-mono text-[10px] text-muted-4">
        This job is no longer available (finished long enough ago to have been cleaned up — see the
        Jobs tab's run history).
      </p>
    );
  }
  if (job === undefined) return <p className="font-mono text-[10px] text-muted-4">Connecting…</p>;

  const status = STATUS_STYLE[job.status];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] text-muted-2">{job.label}</span>
        <span
          className="font-mono text-[9px] font-bold"
          style={{ color: status.color, letterSpacing: '0.08em' }}
        >
          {status.label}
        </span>
      </div>
      {reconnecting && (
        <p className="font-mono text-[10px] text-warning">
          API unreachable — reconnecting (it may be restarting after a rebuild; the job keeps
          running).
        </p>
      )}
      {job.summary !== undefined && (
        <p
          className="font-mono text-[10px]"
          style={{
            color: job.status === 'failed' ? 'var(--color-danger)' : 'var(--color-foreground)',
          }}
        >
          {job.summary}
        </p>
      )}
      <pre
        ref={logRef}
        className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words overflow-y-auto p-3 rounded-[2px]"
        style={{
          background: '#0a0a0a',
          border: `1px solid ${job.status === 'failed' ? 'var(--color-danger)' : 'var(--color-border-3)'}`,
          color: '#999',
          maxHeight: 360,
        }}
      >
        {job.output.trim().length > 0 ? job.output : '(no output yet)'}
      </pre>
    </div>
  );
}
