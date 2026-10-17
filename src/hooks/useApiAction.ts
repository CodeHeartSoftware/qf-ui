import { useState } from 'react';
import { apiMutate } from '@/lib/api';

export interface ApiActionState<T> {
  /** Also returns the result directly (`undefined` on failure — `error` is set instead) so a
   * caller that needs to react immediately (e.g. "run succeeded, refresh the leaderboard") doesn't
   * have to thread that through a `useEffect` watching `result`. */
  run: (body?: unknown) => Promise<T | undefined>;
  loading: boolean;
  result: T | undefined;
  error: string | undefined;
}

/** Shared by every Phase B "run this" button (forward-match run/preview, the Jobs panel's price
 * fetch, a tracked-ticker add/remove) — a POST (or DELETE) to `path`, tracked the same
 * loading/error shape `useApiResource` already standardizes for GETs. `result`/`error` from a
 * PREVIOUS call are cleared at the start of the next one, so a stale success message never
 * lingers next to a fresh in-flight spinner. */
export function useApiAction<T>(
  path: string,
  method: 'POST' | 'DELETE' = 'POST',
): ApiActionState<T> {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T>();
  const [error, setError] = useState<string>();

  const run = async (body?: unknown): Promise<T | undefined> => {
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const response = await apiMutate<T>(method, path, body);
      setResult(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, result, error };
}
