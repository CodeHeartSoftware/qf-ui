import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface ApiResourceState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  /** Re-issues the same GET — e.g. after a Phase B action (like "Run Next Round") mutates
   * something this resource reads, so the UI reflects it without a full page reload. */
  refetch: () => void;
}

/** Shared by every `use<Resource>` hook below — introduced here (a new `src/hooks/` folder,
 * alongside `src/features/*`/`src/components/*`/`src/utils/*`/`src/constants/*`) the first time
 * more than one feature needed the same "fetch this path, track loading/error/data" shape, same
 * rationale `src/constants/` itself was introduced under in `frontend-conventions`. Pass `null`
 * for `path` to skip fetching entirely (e.g. a detail hook with no id selected yet) — returns
 * `loading: false` and no data rather than issuing a request. */
export function useApiResource<T>(path: string | null): ApiResourceState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(path !== null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (path === null) {
      setData(undefined);
      setError(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    apiGet<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, reloadNonce]);

  return {
    data,
    error,
    loading,
    refetch: () => {
      setReloadNonce((n) => n + 1);
    },
  };
}
