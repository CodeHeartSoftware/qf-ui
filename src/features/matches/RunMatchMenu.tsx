import { useState } from 'react';
import ActionLog from '@/components/ui/ActionLog';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { LiveJobLogView } from '@/features/jobs/LiveJobLog';
import PreviewMovesSummary from './PreviewMovesSummary';
import { useRunMatchMenu } from './useRunMatchMenu';

const MODAL_TITLE: Record<'daily' | 'run' | 'preview' | 'end', string> = {
  daily: 'Daily Cycle',
  run: 'Run Next Trading Day',
  preview: 'Run Preview',
  end: 'End Simulation',
};

/** Real Phase B wiring — both options spawn `apps/cli`'s own `match forward run`/`preview`
 * commands server-side. A result renders `PreviewMovesSummary` — the ONLY "what did each bot
 * decide" answer, moves only, no prose — then the raw combined stdout/stderr in `ActionLog`,
 * collapsed by default once there's at least one move to summarize, since that's the
 * fallback/debugging view rather than the primary reading surface. Deliberately does NOT also
 * render `DecisionExplainer`'s per-security signal cards here — tried, but for THIS surface
 * (skimming what a bot is about to do) that additional layer of expected-return/confidence/
 * ensemble-weight detail read as noise on top of the moves list rather than useful context; it's
 * still used by `CreateMatchModal.tsx`'s historical-run results, a genuinely different reading
 * context. One `Dropdown` action menu rather than two standalone buttons — `Dropdown.tsx`'s own
 * doc comment already names this file as its intended "action menu" shape. State/handlers live in
 * `useRunMatchMenu` — this component only renders. */
export default function RunMatchMenu({
  matchId,
  onMatchAdvanced,
}: {
  matchId: string;
  onMatchAdvanced: () => void;
}) {
  const {
    triggerLabel,
    handleSelect,
    modalOpen,
    closeModal,
    lastAction,
    active,
    endConfirming,
    confirmEnd,
    cancelEnd,
    dailyStartError,
    dailyJob,
    driftedBotIds,
    repinAndRun,
  } = useRunMatchMenu({ matchId, onMatchAdvanced });
  const [logExpanded, setLogExpanded] = useState(false);

  const moves = active?.result?.moves ?? [];
  const hasSummary = moves.length > 0;

  return (
    <>
      <Dropdown
        variant="action"
        triggerLabel={triggerLabel}
        options={[
          { value: 'daily', label: 'Run Daily Cycle' },
          { value: 'preview', label: 'Run Preview' },
          { value: 'run', label: 'Run Next Trading Day' },
          { value: 'end', label: 'End Simulation' },
        ]}
        onSelect={handleSelect}
      />
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={lastAction !== undefined ? MODAL_TITLE[lastAction] : 'Run'}
      >
        {lastAction === 'daily' ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] text-muted-3">
              Fetches the latest prices, checks every model still matches its pinned code, then
              plays every newly available trading day. Runs in the background — closing this is
              fine; the header's job indicator reopens it.
            </p>
            {dailyStartError !== undefined && (
              <p className="font-mono text-[10px] text-danger">{dailyStartError}</p>
            )}
            {dailyStartError === undefined && <LiveJobLogView {...dailyJob} />}
            {driftedBotIds !== undefined && driftedBotIds.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[10px] text-warning">
                  {driftedBotIds.join(', ')} changed since this simulation was pinned. Re-pinning
                  accepts the new code from here on — don't do this for a simulation whose code must
                  stay frozen (e.g. a paper-trading gate run).
                </p>
                <button
                  onClick={repinAndRun}
                  className="self-end font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer"
                  style={{
                    background: 'var(--color-warning)',
                    borderColor: 'var(--color-warning)',
                    color: 'var(--color-background)',
                  }}
                >
                  Re-pin &amp; run
                </button>
              </div>
            )}
          </div>
        ) : endConfirming ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] text-danger">
              This permanently ends the simulation — it can never be resumed or run again. This
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={cancelEnd}
                className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer"
                style={{
                  background: 'var(--color-danger)',
                  borderColor: 'var(--color-danger)',
                  color: 'var(--color-background)',
                }}
              >
                Confirm End Simulation
              </button>
            </div>
          </div>
        ) : (
          <>
            {active?.loading === true && (
              <p className="font-mono text-[10px] text-muted-4">
                {lastAction === 'end' ? 'Ending…' : 'Running…'}
              </p>
            )}
            {active?.error !== undefined && (
              <p className="font-mono text-[10px] text-danger">{active.error}</p>
            )}
            {active?.result !== undefined && (
              <div className="flex flex-col gap-3">
                <PreviewMovesSummary moves={moves} />
                <div className="flex flex-col gap-1">
                  {hasSummary && (
                    <button
                      onClick={() => {
                        setLogExpanded((e) => !e);
                      }}
                      className="self-start font-mono text-[9px] uppercase tracking-widest text-muted-4 bg-transparent cursor-pointer"
                    >
                      {logExpanded ? '▲ hide raw output' : '▼ show raw output'}
                    </button>
                  )}
                  {(!hasSummary || logExpanded) && (
                    <ActionLog output={active.result.output} ok={active.result.ok} />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
