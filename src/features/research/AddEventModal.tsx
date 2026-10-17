import CheckboxList from '@/components/ui/CheckboxList';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import type { EventType, ResearchDataset } from '@/hooks/apiTypes';
import { Field, inputStyle } from './researchFormShared';
import { useAddEventModal } from './useAddEventModal';

/** A brand-new `ResearchEvent`, from scratch — not tied to a news item like
 * `ResearchUpdateModal`'s own event section is. `entityIds`/`evidenceIds` are both real
 * `research-core` arrays that may legitimately be empty (see `ResearchEventSchema`), so neither
 * is required here; picking zero of either just means "not tied to any entity/evidence yet."
 * `eventTypes` constrains the type field to the domain's registered taxonomy (see
 * `ManageEventTypesModal` — that's where a new type is registered) rather than free text, so a
 * from-scratch event can never drift onto an unregistered type. State/handlers live in
 * `useAddEventModal` — this component only renders. */
export default function AddEventModal({
  open,
  onClose,
  domain,
  dataset,
  eventTypes,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  dataset: ResearchDataset;
  eventTypes: EventType[];
  onSuccess: () => void;
}) {
  const {
    type,
    setType,
    date,
    setDate,
    entityIds,
    toggleEntity,
    evidenceIds,
    toggleEvidence,
    canSubmit,
    handleSubmit,
    submit,
  } = useAddEventModal({ domain, onSuccess });

  return (
    <Modal open={open} onClose={onClose} title="Add Event">
      <Field label="Event type">
        {eventTypes.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-4">
            No event types registered yet — use &quot;Manage Event Types&quot; on the Events tab to
            add one first.
          </p>
        ) : (
          <Dropdown
            options={eventTypes.map((t) => ({ value: t.type, label: t.type }))}
            selectedValue={type === '' ? undefined : type}
            onSelect={setType}
          />
        )}
      </Field>
      <Field label="Date">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>

      <Field label={`Entities involved (${String(entityIds.size)} selected)`}>
        <CheckboxList
          items={dataset.entities}
          selectedIds={entityIds}
          labelFor={(entity) => entity.name}
          onToggle={toggleEntity}
          maxHeightClassName="max-h-40"
          emptyMessage="No entities in this dataset yet."
        />
      </Field>

      {dataset.evidence.length > 0 && (
        <Field label={`Cited evidence (${String(evidenceIds.size)} selected, optional)`}>
          <CheckboxList
            items={dataset.evidence}
            selectedIds={evidenceIds}
            labelFor={(evidence) => evidence.description}
            onToggle={toggleEvidence}
            maxHeightClassName="max-h-32"
          />
        </Field>
      )}

      {submit.error !== undefined && (
        <p className="font-mono text-[10px] text-danger">{submit.error}</p>
      )}
      {submit.result !== undefined && (
        <p
          className="font-mono text-[10px]"
          style={{ color: submit.result.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}
        >
          {submit.result.ok
            ? `Applied — dataset now version "${submit.result.newVersion ?? '?'}".`
            : (submit.result.error ?? 'The update was refused.')}
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
          disabled={submit.loading || !canSubmit}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {submit.loading ? 'Submitting…' : '+ Add Event'}
        </button>
      </div>
    </Modal>
  );
}
