const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4410';

interface ApiErrorBody {
  error?: string;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as ApiErrorBody | undefined;
    throw new Error(body?.error ?? `${path} failed with status ${String(res.status)}`);
  }
  return res.json() as Promise<T>;
}

/** Phase B's mutating actions (forward-match run/preview, the market-data fetch job) — these can
 * run for minutes (Docker image builds, `match forward run`'s own deadline), so this has no
 * client-side timeout of its own; the caller's own loading state is what tells the user something
 * is in flight. */
export async function apiMutate<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    ...(body !== undefined
      ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
  if (!res.ok) {
    const responseBody = (await res.json().catch(() => undefined)) as ApiErrorBody | undefined;
    throw new Error(responseBody?.error ?? `${path} failed with status ${String(res.status)}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiMutate<T>('POST', path, body);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiMutate<T>('PATCH', path, body);
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiMutate<T>('DELETE', path);
}
