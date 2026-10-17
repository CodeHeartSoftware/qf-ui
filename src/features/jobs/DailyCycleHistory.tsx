import { useForwardMatches } from '@/hooks/useForwardMatches';
import { useJobRunHistory } from '@/hooks/useJobRunHistory';
import JobRunHistory from './JobRunHistory';

function MatchDailyCycleHistory({ matchId }: { matchId: string }) {
  const { runs, loading, error } = useJobRunHistory(`daily-cycle:${matchId}`);
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] text-muted-2">{matchId}</span>
      <JobRunHistory runs={runs} loading={loading} error={error} />
    </div>
  );
}

/** Every active forward match's past daily cycles (manual or scheduled) — each worker records its
 * own run in `job-run-store` under `daily-cycle:<matchId>`, so a scheduled run that stopped on a
 * drifted pin overnight is visible here the next morning. */
export default function DailyCycleHistory() {
  const { matches } = useForwardMatches();
  const active = matches.filter((m) => m.status === 'active');
  if (active.length === 0) return null;

  return (
    <div className="bg-surface border border-border-2 rounded-[2px] flex flex-col gap-4 px-5 py-4">
      <div>
        <h3 className="font-mono text-sm font-semibold text-foreground">Daily Cycle History</h3>
        <p className="font-mono text-[10px] text-muted-3">
          Fetch prices → check pins → run new trading days, per active forward simulation.
        </p>
      </div>
      {active.map((m) => (
        <MatchDailyCycleHistory key={m.matchId} matchId={m.matchId} />
      ))}
    </div>
  );
}
