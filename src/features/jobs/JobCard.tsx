import { useState } from 'react';
import ActionLog from '@/components/ui/ActionLog';
import StatusPill from '@/components/ui/StatusPill';
import { useApiAction } from '@/hooks/useApiAction';
import { useJobRunHistory } from '@/hooks/useJobRunHistory';
import type { DatasetFreshness } from '@/hooks/apiTypes';
import { CATEGORY_META, type JobDefinition } from './jobs';
import DatasetFreshnessCard from './DatasetFreshnessCard';
import JobRunHistory from './JobRunHistory';
import JobRunHistorySpark from './JobRunHistorySpark';

interface FetchJobResult {
  ok: boolean;
  universeId: string;
  datasetId: string;
  datasetVersion: string;
  tickers: string[];
  fetchedNewBars: boolean;
  output: string;
  note: string;
}

/** Mirrors `stock-bots-ui`'s `JobCard` shell (header, meta strip, expandable detail) but with
 * every fabricated piece swapped for something real: no invented live progress bar. A job with
 * `job.runPath` (see `jobs.ts`) really runs via that path, rendering the real action's own
 * combined CLI output; a job without one keeps `RunMatchMenu`'s stub convention — a real,
 * clickable button that honestly records what was requested rather than faking success. Past
 * runs (`@quant-fusion/job-run-store`, via `job.jobId`) are fetched once, up front — like
 * `stock-bots-ui`'s own `history`, always available for the always-visible spark strip
 * (`JobRunHistorySpark`) next to the history toggle; only the detailed table
 * (`JobRunHistory`) stays gated behind expanding it. Refetched after any run this card itself
 * triggers, never on a timer. */
export default function JobCard({
  job,
  datasets,
}: {
  job: JobDefinition;
  datasets: DatasetFreshness[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [requestedAt, setRequestedAt] = useState<string>();
  const runJob = useApiAction<FetchJobResult>(job.runPath ?? '');
  const history = useJobRunHistory(job.jobId);
  const cat = CATEGORY_META[job.category];

  const tickers = datasets.flatMap((d) => d.tickers);
  const staleCount = tickers.filter((t) => t.status !== 'current').length;
  const freshnessLabel =
    tickers.length === 0
      ? 'no tracked tickers'
      : staleCount === 0
        ? `all ${String(tickers.length)} current`
        : `${String(staleCount)} of ${String(tickers.length)} stale`;

  const handleRunNow = async () => {
    if (job.runPath === undefined) {
      setRequestedAt(new Date().toISOString());
      return;
    }
    await runJob.run();
    history.refetch();
  };

  return (
    <div className="bg-surface rounded-[2px] border border-border-3">
      <div className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-foreground">{job.name}</span>
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm"
              style={{
                color: cat.color,
                border: `1px solid ${cat.color}33`,
                background: cat.color + '11',
                letterSpacing: '0.07em',
              }}
            >
              {cat.label}
            </span>
            {job.runPath === undefined && <StatusPill label="Not wired up yet" tone="muted" />}
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-muted-2">{job.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => {
              void handleRunNow();
            }}
            disabled={runJob.loading}
            className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-background)',
              letterSpacing: '0.06em',
            }}
          >
            {runJob.loading ? 'RUNNING…' : 'RUN NOW'}
          </button>
          {requestedAt !== undefined && (
            <p className="font-mono text-[9px] text-muted-3 text-right max-w-[220px]">
              Requested {requestedAt.slice(11, 16)} UTC — stubbed, not wired up yet.
            </p>
          )}
        </div>
      </div>

      {runJob.error !== undefined && (
        <p className="font-mono text-[10px] px-4 pb-3 text-danger">{runJob.error}</p>
      )}
      {runJob.result !== undefined && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="font-mono text-[10px] text-muted-2">{runJob.result.note}</p>
          <ActionLog ok={runJob.result.ok} output={runJob.result.output} />
        </div>
      )}

      <div
        className="grid gap-4 px-4 py-2 border-t border-surface-2 overflow-x-auto"
        style={{ gridTemplateColumns: 'repeat(4, auto)' }}
      >
        {[
          { label: 'Source', value: job.source },
          { label: 'Output', value: job.output },
          { label: 'Datasets', value: String(datasets.length) },
          { label: 'Freshness', value: freshnessLabel },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] tracking-widest uppercase text-muted-3">
              {m.label}
            </span>
            <span className="font-mono text-[10px] whitespace-nowrap text-muted-2">{m.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setExpanded((e) => !e);
        }}
        className="w-full flex items-center justify-between px-4 py-2 border-0 border-t border-surface-2 bg-transparent cursor-pointer"
      >
        <span className="font-mono text-[9px] text-muted-4">
          {datasets.length === 0
            ? 'no datasets to show'
            : `${String(datasets.length)} dataset(s) this job would refresh`}
        </span>
        <span className="font-mono text-[10px] text-muted-4">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-surface-2">
          {datasets.length === 0 ? (
            <p className="font-mono text-xs mt-3 text-muted-4">
              No active forward simulations reference a market-data dataset right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mt-3">
              {datasets.map((d) => (
                <DatasetFreshnessCard key={`${d.id}@${d.version}`} dataset={d} />
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setHistoryOpen((o) => !o);
        }}
        className="w-full flex items-center justify-between px-4 py-2 border-0 border-t border-surface-2 bg-transparent cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {history.runs.length > 0 && <JobRunHistorySpark runs={history.runs} />}
          <span className="font-mono text-[9px] text-muted-4">
            {history.runs.length === 0
              ? 'no recorded runs yet'
              : `last ${String(history.runs.length)} run${history.runs.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-4">{historyOpen ? '▲' : '▼'}</span>
      </button>

      {historyOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-surface-2">
          <JobRunHistory runs={history.runs} loading={history.loading} error={history.error} />
        </div>
      )}
    </div>
  );
}
