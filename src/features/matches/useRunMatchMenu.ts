import { useEffect, useState } from 'react';
import { useApiAction } from '@/hooks/useApiAction';
import type { DailyCycleResult, PreviewMove } from '@/hooks/apiTypes';
import { useLiveJob } from '@/hooks/useLiveJob';

export interface CliActionResult {
  ok: boolean;
  exitCode: number | null;
  output: string;
  /** Every `TradingDecision` a quant-sdk-js-based bot emitted this action, recovered from its own
   * `QUANT_DECISION_JSON:` log lines (see `apps/api`'s `parseQuantDecisions`) — a
   * real part of the API response, but NOT rendered by `RunMatchMenu.tsx` (tried; for this
   * surface it read as noise on top of `moves` below, not useful context — see that file's own
   * doc comment). Still present here so this type matches the real response shape. */
  decisions?: unknown[];
  /** Preview only (never present for run/end) — every participant's actual move, one entry per
   * `(participantId, ticker)`, parsed from `PREVIEW_MOVE_JSON:` lines (see
   * `apps/api`'s `parsePreviewMoves`). Covers every bot, not just a
   * quant-sdk-js-based one — this is THE "what did each bot decide" summary this modal shows. */
  moves?: PreviewMove[];
}

export type RunMenuAction = 'daily' | 'run' | 'preview' | 'end';

/** State/handlers for `RunMatchMenu` — "Run Next Round"/"Run Preview" spawn `apps/cli`'s own
 * `match forward run`/`preview` commands server-side (see `apps/api`'s
 * forward-matches router). Picking either opens the result modal immediately (so its "running…"
 * state is visible) and populates it with the CLI's own combined stdout/stderr once the call
 * settles. "Preview" never mutates the match; "Run Next Round" does, so a successful run calls
 * `onMatchAdvanced` so the caller can refresh whatever else reads this match's state (the
 * leaderboard, its own roundsPlayed count).
 *
 * "End Match" is different: it's a deliberate, irreversible stop (see `apps/cli`'s `match forward
 * end` — a match ended this way can never be resumed, same as one that reached `'completed'` or
 * `'forfeited'` on its own), so picking it does NOT fire immediately — `endConfirming` gates it
 * behind an explicit `confirmEnd()` the modal renders as a real confirmation step, matching this
 * app's other irreversible actions (see `DeleteItemButton`'s own doc comment on the research
 * side). A successful end also calls `onMatchAdvanced` — the ended match stays selectable in the
 * switcher (`MatchesPanel.tsx` shows every match, any status, so its final leaderboard is still
 * reviewable), but its `status` flipping away from `'active'` is what makes `MatchesPanel.tsx`
 * stop rendering this menu for it. */
/**
 * "Run Daily Cycle" (the primary action) is different from the other three: it starts a
 * BACKGROUND job (`POST /daily-cycle` returns a job id immediately — fetch prices, check pins,
 * run every newly available round) and the modal follows that job's streaming log via
 * `useLiveJob`, rather than holding one HTTP request open. When the cycle stops because a bot's
 * code drifted from its pin, `driftedBotIds` lets the modal offer "Re-pin & run", which starts
 * the same cycle again with `repin: true`.
 */
export function useRunMatchMenu({
  matchId,
  onMatchAdvanced,
}: {
  matchId: string;
  onMatchAdvanced: () => void;
}) {
  const runAction = useApiAction<CliActionResult>(
    `/api/forward-matches/${encodeURIComponent(matchId)}/run`,
  );
  const previewAction = useApiAction<CliActionResult>(
    `/api/forward-matches/${encodeURIComponent(matchId)}/preview`,
  );
  const endAction = useApiAction<CliActionResult>(
    `/api/forward-matches/${encodeURIComponent(matchId)}/end`,
  );
  const dailyAction = useApiAction<{ jobId: string }>(
    `/api/forward-matches/${encodeURIComponent(matchId)}/daily-cycle`,
  );
  const [dailyJobId, setDailyJobId] = useState<string>();
  const dailyJob = useLiveJob(dailyJobId);
  const [lastAction, setLastAction] = useState<RunMenuAction>();
  const [modalOpen, setModalOpen] = useState(false);
  const [endConfirming, setEndConfirming] = useState(false);
  const dailyRunning = dailyAction.loading || dailyJob.job?.status === 'running';
  const busy = runAction.loading || previewAction.loading || endAction.loading || dailyRunning;

  const dailyResult = dailyJob.job?.result as DailyCycleResult | undefined;
  const dailyStatus = dailyJob.job?.status;
  useEffect(() => {
    if (dailyStatus === 'succeeded') onMatchAdvanced();
    // `onMatchAdvanced` is deliberately not a dependency — only a status TRANSITION should fire it.
  }, [dailyStatus]);

  const startDailyCycle = (repin: boolean) => {
    setDailyJobId(undefined);
    void dailyAction.run({ repin }).then((started) => {
      if (started !== undefined) setDailyJobId(started.jobId);
    });
  };

  const handleSelect = (action: RunMenuAction) => {
    if (busy) return;
    setLastAction(action);
    setModalOpen(true);
    if (action === 'daily') {
      startDailyCycle(false);
    } else if (action === 'run') {
      void runAction.run().then((result) => {
        if (result?.ok === true) onMatchAdvanced();
      });
    } else if (action === 'preview') {
      void previewAction.run();
    } else {
      setEndConfirming(true);
    }
  };

  const confirmEnd = () => {
    setEndConfirming(false);
    void endAction.run().then((result) => {
      if (result?.ok === true) onMatchAdvanced();
    });
  };

  const cancelEnd = () => {
    setEndConfirming(false);
    setModalOpen(false);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setEndConfirming(false);
  };

  const active =
    lastAction === 'run'
      ? runAction
      : lastAction === 'preview'
        ? previewAction
        : lastAction === 'end'
          ? endAction
          : undefined;

  return {
    triggerLabel: dailyRunning
      ? 'CYCLING…'
      : runAction.loading
        ? 'RUNNING…'
        : previewAction.loading
          ? 'PREVIEWING…'
          : endAction.loading
            ? 'ENDING…'
            : 'RUN',
    handleSelect,
    modalOpen,
    closeModal,
    lastAction,
    active,
    endConfirming,
    confirmEnd,
    cancelEnd,
    dailyStartError: dailyAction.error,
    dailyJob,
    driftedBotIds: dailyStatus === 'failed' ? dailyResult?.driftedBotIds : undefined,
    repinAndRun: () => {
      startDailyCycle(true);
    },
  };
}
