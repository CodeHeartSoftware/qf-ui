import type { DailyCycleSchedule } from '@/hooks/apiTypes';
import { useDailyCycleSchedule } from './useDailyCycleSchedule';

/** Runs Simulation → Matches' "Run Daily Cycle" automatically, once per weekday at a set time, for
 * the chosen active matches. In-process in the API — only fires while the API is running, and
 * never re-pins on its own (a drifted bot makes the scheduled cycle stop and say so in the Jobs
 * tab's daily-cycle history). */
export default function DailyCycleScheduleCard({
  saved,
  onSaved,
}: {
  saved: DailyCycleSchedule | undefined;
  onSaved: () => void;
}) {
  const {
    activeMatchIds,
    enabled,
    setEnabled,
    timeLocal,
    setTimeLocal,
    matchIds,
    toggleMatch,
    saving,
    saveError,
    save,
  } = useDailyCycleSchedule(saved, onSaved);

  return (
    <div
      className="p-4 flex flex-col gap-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div>
        <h2 className="font-mono text-sm font-bold text-foreground">Daily Cycle Schedule</h2>
        <p className="font-mono text-[10px] text-muted-3 mt-1">
          Fetch prices → check pins → run new trading days, automatically on weekdays. Only fires
          while the API is running; never re-pins on its own.
          {saved?.lastTriggeredDate !== undefined && ` Last fired ${saved.lastTriggeredDate}.`}
        </p>
      </div>

      <label className="flex items-center gap-2 font-mono text-xs text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
          }}
        />
        Enabled
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Time (API host's local time — after the US close is a good default)
        </span>
        <input
          type="time"
          value={timeLocal}
          onChange={(e) => {
            setTimeLocal(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={{
            colorScheme: 'dark',
            background: 'transparent',
            border: '1px solid var(--color-border-4)',
            borderRadius: 2,
            padding: '6px 8px',
            width: 140,
          }}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Simulations
        </span>
        {activeMatchIds.length === 0 && (
          <p className="font-mono text-[10px] text-muted-4">No active forward simulations.</p>
        )}
        {activeMatchIds.map((matchId) => (
          <label
            key={matchId}
            className="flex items-center gap-2 font-mono text-[11px] text-muted-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={matchIds.includes(matchId)}
              onChange={() => {
                toggleMatch(matchId);
              }}
            />
            {matchId}
          </label>
        ))}
      </div>

      {saveError !== undefined && <p className="font-mono text-[10px] text-danger">{saveError}</p>}

      <button
        onClick={() => {
          void save();
        }}
        disabled={saving}
        className="self-start font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: 'var(--color-accent)',
          borderColor: 'var(--color-accent)',
          color: 'var(--color-background)',
        }}
      >
        {saving ? 'Saving…' : 'Save Schedule'}
      </button>
    </div>
  );
}
