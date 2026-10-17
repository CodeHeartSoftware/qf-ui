import Tag from '@/components/ui/Tag';
import { colorForSlug } from '@/utils/format';
import type { PreviewMove } from '@/hooks/apiTypes';

/** The PRIMARY answer to "what did each bot decide" — one compact line per `(participant,
 * ticker)` move, grouped by bot, ahead of anything else a preview result renders (see
 * `RunMatchMenu.tsx`). Deliberately excludes tickers a bot held untouched (never in `moves` at
 * all — see `apps/api`'s `parsePreviewMoves.ts` doc comment): this is a moves
 * summary, not a full holdings dump, so a match with dozens of tracked tickers and one real trade
 * still reads as ONE line, not a wall of "HOLD"s. A bot with zero moves here may still have held
 * everything on purpose — the raw output below still has the full per-bot confirmation. */
export default function PreviewMovesSummary({ moves }: { moves: PreviewMove[] }) {
  if (moves.length === 0) return null;

  const byParticipant = new Map<string, PreviewMove[]>();
  for (const move of moves) {
    const existing = byParticipant.get(move.participantId) ?? [];
    existing.push(move);
    byParticipant.set(move.participantId, existing);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
        Moves ({moves.length})
      </span>
      {[...byParticipant.entries()].map(([participantId, participantMoves]) => (
        <div
          key={participantId}
          className="p-3 flex flex-col gap-1.5"
          style={{
            background: 'var(--color-background)',
            border: '1px solid var(--color-border-4)',
            borderRadius: 2,
          }}
        >
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {participantId}
          </span>
          {participantMoves.map((move) => (
            <div key={move.ticker} className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Tag label={move.ticker} color={colorForSlug(move.ticker)} />
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{
                    color:
                      move.side === 'BUY'
                        ? 'var(--color-accent)'
                        : move.side === 'SELL'
                          ? 'var(--color-danger)'
                          : 'var(--color-muted-3)',
                  }}
                >
                  {move.side}
                  {move.quantity !== undefined ? ` ${move.quantity.toLocaleString('en-US')}` : ''}
                </span>
              </div>
              {move.changed && (
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: 'var(--color-warning)' }}
                >
                  changed since stored config
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
