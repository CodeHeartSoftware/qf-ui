import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useApiAction } from '@/hooks/useApiAction';

interface CreateDomainResult {
  ok: boolean;
  domain?: string;
  datasetId?: string;
  error?: string;
}

const inputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
  width: '100%',
};

/** Creates a brand-new, EMPTY research domain — a real `research_datasets` row via
 * `@quant-fusion/research-store`'s `create:domain` script (see
 * `apps/api/src/lib/researchStore.ts`), not a fabricated starter dataset. A domain
 * created here starts with zero entities/relationships/etc. and grows the exact same way fusion's
 * own dataset does — through the News feed's "Add to Research" modal or a hand-written update
 * file — never through this form itself. */
export default function CreateDomainModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the new domain's slug after a successful create, so the caller can refresh the
   * domain list and switch to it. */
  onCreated: (domain: string) => void;
}) {
  const [name, setName] = useState('');
  const create = useApiAction<CreateDomainResult>('/api/research/domains');

  const handleCreate = async () => {
    const result = await create.run({ name: name.trim() });
    if (result?.ok === true && result.domain !== undefined) {
      onCreated(result.domain);
      setName('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Research Domain">
      <p className="font-mono text-[10px] leading-relaxed text-muted-3">
        Starts completely empty — no fabricated starter content. Grow it afterward the same way any
        domain grows: a research update, applied through the real merge/validate pipeline.
      </p>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">Name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          placeholder="e.g. Battery Materials"
          className="font-mono text-xs text-foreground"
          style={inputStyle}
          autoFocus
        />
      </label>
      {create.error !== undefined && (
        <p className="font-mono text-[10px] text-danger">{create.error}</p>
      )}
      {create.result?.ok === false && (
        <p className="font-mono text-[10px] text-danger">
          {create.result.error ?? 'The domain could not be created.'}
        </p>
      )}
      <div
        className="flex items-center justify-end gap-2 pt-2"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <button
          onClick={onClose}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            void handleCreate();
          }}
          disabled={create.loading || name.trim() === ''}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {create.loading ? 'Creating…' : 'Create Domain'}
        </button>
      </div>
    </Modal>
  );
}
