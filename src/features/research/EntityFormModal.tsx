import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import type { EntityType, ResearchEntity } from '@/hooks/apiTypes';
import { Field, buildEntityId, inputStyle } from './researchFormShared';
import useEntityFormModal from '@/hooks/useEntityFormModal.tsx';

/**
 * Create or edit ONE `ResearchEntity`, from scratch — not tied to a news item. Both modes submit
 * through the same `apply-update` pipeline `ResearchUpdateModal` already uses; the only
 * difference is whether the entity id already exists. `@quant-fusion/research-store`'s
 * `mergeResearchUpdate` treats an existing id as a deliberate edit of that record's mutable
 * fields (type/name/description) rather than a duplicate — see that function's own doc comment.
 * `recordedAt` is never exposed here to edit even for an existing entity — the server keeps it
 * fixed on purpose (see `merge.ts`). `entityTypes` constrains the type field to the domain's
 * registered taxonomy (see `ManageEntityTypesModal` — that's where a new type is registered)
 * rather than free text, so a from-scratch or edited entity can never drift onto an unregistered
 * type.
 */
export default function EntityFormModal({
  open,
  onClose,
  domain,
  entity,
  entityTypes,
  onSuccess,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  entity?: ResearchEntity;
  entityTypes: EntityType[];
  onSuccess: () => void;
  onChanged: () => void;
}) {
  const {
    submitError,
    submitLoading,
    submitResult,
    canSubmit,
    handleNameChange,
    setType,
    handleDescriptionChange,
    handleSubmit,
    type,
    name,
    description,
  } = useEntityFormModal({ domain, entity, onSuccess, onChanged });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entity === undefined ? 'Add Entity' : 'Edit Entity'}
    >
      <Field label="Name">
        <input
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Fujikura Ltd."
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>
      <Field label="Type">
        {entityTypes.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-4">
            No entity types registered yet — use &quot;Manage Entity Types&quot; on the Entities tab
            to add one first.
          </p>
        ) : (
          <Dropdown
            options={entityTypes.map((t) => ({ value: t.type, label: t.type }))}
            selectedValue={type === '' ? undefined : type}
            onSelect={setType}
          />
        )}
      </Field>
      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          rows={2}
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>

      {entity === undefined && (
        <p className="font-mono text-[9px] text-muted-4">
          Will be minted as entity id "{buildEntityId(name || '…')}".
        </p>
      )}

      {submitError !== undefined && (
        <p className="font-mono text-[10px] text-danger">{submitError}</p>
      )}
      {submitResult !== undefined && (
        <p
          className="font-mono text-[10px]"
          style={{ color: submitResult.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}
        >
          {submitResult.ok
            ? `Applied — dataset now version "${submitResult.newVersion ?? '?'}".`
            : (submitResult.error ?? 'The update was refused.')}
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
          Close
        </button>
        <button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submitLoading || !canSubmit}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {submitLoading ? 'Submitting…' : entity === undefined ? '+ Add Entity' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
