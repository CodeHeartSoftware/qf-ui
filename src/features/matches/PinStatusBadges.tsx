import type { BotPinState } from '@/hooks/apiTypes';
import { usePinStatus } from '@/hooks/usePinStatus';

const STATE_STYLE: Record<BotPinState, { label: string; color: string; title: string }> = {
  pinned: {
    label: 'PINNED',
    color: 'var(--color-accent)',
    title: 'Model code matches what this simulation was pinned to.',
  },
  drifted: {
    label: 'DRIFTED',
    color: 'var(--color-warning)',
    title:
      'Model code changed since pinning — the next run refuses until you re-pin (Run Daily Cycle → Re-pin & run).',
  },
  unpinned: {
    label: 'UNPINNED',
    color: 'var(--color-muted-3)',
    title: 'This simulation is not pinned — any code change is picked up on the next run.',
  },
};

/** Per-participant pin state for one match (`match forward pin-status`) — so a drifted bot is
 * visible BEFORE a run refuses, not discovered from a failed run's log. Silent while loading or
 * on error: this is supplementary to the leaderboard, never a blocker for reading it. */
export default function PinStatusBadges({ matchId }: { matchId: string }) {
  const { pinStatus } = usePinStatus(matchId);
  if (pinStatus === undefined) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {pinStatus.bots.map((bot) => {
        const style = STATE_STYLE[bot.state];
        return (
          <span
            key={bot.botId}
            title={style.title}
            className="font-mono text-[9px] px-1.5 py-0.5"
            style={{
              color: style.color,
              border: `1px solid color-mix(in srgb, ${style.color} 27%, transparent)`,
              background: `color-mix(in srgb, ${style.color} 9%, transparent)`,
              borderRadius: 2,
              letterSpacing: '0.06em',
            }}
          >
            {bot.botId} · {style.label}
          </span>
        );
      })}
    </div>
  );
}
