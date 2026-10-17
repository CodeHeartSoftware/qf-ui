import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/api';
import type { DailyCycleSchedule, SettingsStatus } from '@/hooks/apiTypes';
import { useForwardMatches } from '@/hooks/useForwardMatches';

/** `DailyCycleScheduleCard`'s draft state — seeded from the saved schedule once it loads, saved
 * back as a whole via `POST /api/settings { dailyCycle }` (which leaves the API key untouched). */
export function useDailyCycleSchedule(saved: DailyCycleSchedule | undefined, onSaved: () => void) {
  const { matches } = useForwardMatches();
  const activeMatchIds = matches.filter((m) => m.status === 'active').map((m) => m.matchId);
  const [enabled, setEnabled] = useState(false);
  const [timeLocal, setTimeLocal] = useState('17:30');
  const [matchIds, setMatchIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  useEffect(() => {
    if (saved === undefined) return;
    setEnabled(saved.enabled);
    setTimeLocal(saved.timeLocal);
    setMatchIds(saved.matchIds);
  }, [saved]);

  const toggleMatch = (matchId: string) => {
    setMatchIds((ids) =>
      ids.includes(matchId) ? ids.filter((id) => id !== matchId) : [...ids, matchId],
    );
  };

  const save = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await apiPost<SettingsStatus>('/api/settings', {
        dailyCycle: { enabled, timeLocal, matchIds },
      });
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
