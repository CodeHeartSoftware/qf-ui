import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import type { RelationshipType, ResearchDataset, ResearchRelationship } from '@/hooks/apiTypes';
import { Field, inputStyle } from './researchFormShared';
import useRelationshipFormModal from './useRelationshipFormModal';

/**
 * Create a brand-new relationship, or add a new state (a status change over time) to an
 * EXISTING one — from scratch, not tied to a news item. Both submit through the same
 * `apply-update` pipeline: a fresh relationship id inserts a new record, a matching existing id
 * appends `states[]` (see `mergeResearchUpdate`'s own doc comment) — `research-core` has no
 * "edit a relationship's type/endpoints in place" concept, since that would rewrite what the
 * relationship IS rather than record how its status evolved, so this modal doesn't offer it;
 * deleting and re-creating is the honest way to fix a wrong from/to/type. `relationshipTypes`
 * constrains a brand-new relationship's type field to the domain's registered taxonomy (see
 * `ManageRelationshipTypesModal` — that's where a new type is registered) rather than free text.
 * State/handlers live in `useRelationshipFormModal` — this component only renders.
 */
export default function RelationshipFormModal({
  open,
  onClose,
  domain,
  dataset,
  relationship,
  relationshipTypes,
  onSuccess,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  dataset: ResearchDataset;
  /** Given means "add a new state to this existing relationship"; `undefined` means "create a
   * brand-new relationship." */
  relationship?: ResearchRelationship;
  relationshipTypes: RelationshipType[];
  onSuccess: () => void;
  onChanged: () => void;
}) {
  const {
    submitError,
    submitResult,
    submitLoading,
    canSubmit,
    entityOptions,
    fromEntityId,
    setFromEntityId,
    toEntityId,
    setToEntityId,
    type,
    setType,
    status,
    setStatus,
    effectiveFrom,
    setEffectiveFrom,
    confidence,
    setConfidence,
    handleSubmit,
  } = useRelationshipFormModal({ domain, dataset, relationship, onSuccess, onChanged });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={relationship === undefined ? 'Add Relationship' : 'Add State'}
    >
      {relationship === undefined ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="From entity">
              <Dropdown
                options={entityOptions}
                selectedValue={fromEntityId}
                onSelect={setFromEntityId}
              />
            </Field>
            <Field label="To entity">
              <Dropdown
                options={entityOptions}
                selectedValue={toEntityId}
                onSelect={setToEntityId}
              />
            </Field>
          </div>
          <Field label="Relationship type">
            {relationshipTypes.length === 0 ? (
              <p className="font-mono text-[10px] text-muted-4">
                No relationship types registered yet — use &quot;Manage Relationship Types&quot; on
                the Relationships tab to add one first.
              </p>
            ) : (
              <Dropdown
                options={relationshipTypes.map((t) => ({ value: t.type, label: t.type }))}
                selectedValue={type === '' ? undefined : type}
                onSelect={setType}
              />
            )}
          </Field>
        </>
      ) : (
        <p className="font-mono text-[10px] text-muted-3">
          Adding a new state to the existing "{relationship.type}" relationship — its type/
          endpoints don't change; this records that its status has evolved.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Status label">
          <input
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
            placeholder="e.g. qualification track"
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </Field>
        <Field label="Effective from">
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => {
              setEffectiveFrom(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </Field>
      </div>
      <Field label="Confidence (0-1)">
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={confidence}
          onChange={(e) => {
            setConfidence(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>

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
          {submitLoading
            ? 'Submitting…'
            : relationship === undefined
              ? '+ Add Relationship'
              : '+ Add State'}
        </button>
      </div>
    </Modal>
  );
}
