import { useState } from 'react';
import { apiDelete } from '@/lib/api';

interface DeleteResult {
  ok: boolean;
  error?: string;
}

/**
 * A real `DELETE /api/research/:domain/:collection/:id` — see `@quant-fusion/research-store`'s
 * `renderDeleteSql` for why this is an actual removal, not a retraction, and why it's refused
 * (server-side, via the full dataset re-validation that function runs) rather than silently
 * corrupting the dataset if the item is still referenced elsewhere (e.g. an entity a relationship
 * still points at). Requires a second click within a few seconds to actually fire — cheap
 * protection against a stray click on something this permanent, without a whole confirm dialog
 * for what's usually an easy, no-stakes cleanup (a just-created duplicate, an entity that was
 * never real).
 */
export default function DeleteItemButton({
  domain,
  collection,
  id,
  label = 'delete',
  onDeleted,
}: {
  domain: string;
  collection: 'entities' | 'relationships' | 'hypotheses';
  id: string;
  label?: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      setError(undefined);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const result = await apiDelete<DeleteResult>(
        `/api/research/${encodeURIComponent(domain)}/${collection}/${encodeURIComponent(id)}`,
      );
      if (!result.ok) {
        setError(result.error ?? 'Could not delete — it may still be referenced elsewhere.');
        setConfirming(false);
        return;
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          void handleClick();
        }}
        onBlur={() => {
          setConfirming(false);
        }}
        disabled={busy}
        className="font-mono text-[10px] bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        style={{ color: confirming ? 'var(--color-danger)' : 'var(--color-muted-3)' }}
      >
        {busy ? '…' : confirming ? 'confirm delete?' : `✕ ${label}`}
      </button>
      {error !== undefined && <span className="font-mono text-[9px] text-danger">{error}</span>}
    </span>
  );
}
