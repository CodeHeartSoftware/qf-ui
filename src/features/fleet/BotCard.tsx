import { useState } from 'react';
import ActionLog from '@/components/ui/ActionLog';
import StatusPill from '@/components/ui/StatusPill';
import { useApiAction } from '@/hooks/useApiAction';
import MatchStandingDetail from './MatchStandingDetail';
import PreviewMovesSummary from '../matches/PreviewMovesSummary';
import type { BotSummary, ForwardMatchSummary, PreviewMove } from '@/hooks/apiTypes';

const MATCH_STATUS_TONE = {
  active: 'accent',
  completed: 'info',
  forfeited: 'danger',
  ended: 'muted',
} as const;

interface CliActionResult {
  ok: boolean;
  exitCode: number | null;
  output: string;
  /** See `PreviewMovesSummary`'s own doc comment — always this ONE bot's own moves only, since
   * this card's preview call already scopes `--participant` to `bot.id`. */
  moves?: PreviewMove[];
}

export default function BotCard({
  bot,
  matches,
}: {
  bot: BotSummary;
  matches: ForwardMatchSummary[];
}) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  // A bot can be in more than one match at once (see `useFleet.ts`), but this card has room for
  // one preview action — the first ACTIVE one, the same "most useful reading order" convention
  // `useFleet`'s own bot sort already uses.
  const activeMatch = matches.find((m) => m.status === 'active');
  const previewAction = useApiAction<CliActionResult>(
    `/api/forward-matches/${encodeURIComponent(activeMatch?.matchId ?? '')}/preview`,
  );

  const handlePreview = () => {
    if (activeMatch === undefined) return;
    void previewAction.run({ participantId: bot.id });
  };

  return (
    <div className="animate-fade-in flex flex-col bg-surface border border-border-2 rounded-[2px]">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-semibold truncate text-foreground">{bot.name}</h3>
          <p className="font-mono text-[10px] truncate text-muted-3">
            {bot.id} · v{bot.version}
          </p>
        </div>
        <button
          onClick={handlePreview}
          disabled={activeMatch === undefined || previewAction.loading}
          title={
            activeMatch === undefined
              ? 'This model has no active forward simulation to preview.'
              : `Preview ${bot.id}'s next decision in ${activeMatch.matchId} — compares what it would decide at the simulation's stored config against a freshly regenerated one, without mutating the simulation.`
          }
          className="shrink-0 font-mono text-xs font-bold px-4 py-1.5 rounded-[1px] border cursor-pointer disabled:cursor-not-allowed"
          style={
            activeMatch === undefined
              ? {
                  borderColor: 'var(--color-border-4)',
                  background: 'transparent',
                  color: 'var(--color-muted-3)',
                }
              : {
                  borderColor: 'var(--color-accent)',
                  background: previewAction.loading ? 'transparent' : 'var(--color-accent)',
                  color: previewAction.loading ? 'var(--color-accent)' : 'var(--color-background)',
                }
          }
        >
          {previewAction.loading ? 'PREVIEWING…' : 'PREVIEW'}
        </button>
      </div>

      <p className="font-mono text-[11px] leading-relaxed px-5 pb-4 text-muted-2 line-clamp-3">
        {bot.description}
      </p>

      {previewAction.error !== undefined && (
        <p className="font-mono text-[10px] px-5 pb-3 text-danger">{previewAction.error}</p>
      )}
      {previewAction.result !== undefined && (
        <div className="px-5 pb-4 flex flex-col gap-3">
          <PreviewMovesSummary moves={previewAction.result.moves ?? []} />
          <ActionLog output={previewAction.result.output} ok={previewAction.result.ok} />
        </div>
      )}

      <div className="border-t border-surface-2">
        <p className="font-mono text-[10px] tracking-widest uppercase px-5 pt-3 pb-2 text-muted-3">
          Forward Simulations ({matches.length})
        </p>
        {matches.length === 0 && (
          <p className="font-mono text-[11px] px-5 pb-4 text-muted-4">
            Not currently in a simulation.
          </p>
        )}
        {matches.map((m) => {
          const isExpanded = expandedMatchId === m.matchId;
          return (
            <div key={m.matchId} className="border-t border-surface-3 first:border-t-0">
              <button
                onClick={() => {
                  setExpandedMatchId(isExpanded ? null : m.matchId);
                }}
                className="w-full flex items-center justify-between px-5 py-2.5 font-mono text-[11px] transition-colors bg-transparent"
              >
                <span className="flex items-center gap-2">
                  <StatusPill label={m.status} tone={MATCH_STATUS_TONE[m.status]} />
                  <span className="text-muted-2">{m.matchId}</span>
                </span>
                <span className="flex items-center gap-3 text-muted-3">
                  <span>{m.roundsPlayed} trading days</span>
                  <span>{isExpanded ? '▲' : '▼'}</span>
                </span>
              </button>
              {isExpanded && <MatchStandingDetail matchId={m.matchId} participantId={bot.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
