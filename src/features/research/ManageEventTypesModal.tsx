import Modal from '@/components/ui/Modal';
import type { EventType } from '@/hooks/apiTypes';
import { inputStyle } from './researchFormShared';
import { useManageEventTypesModal } from './useManageEventTypesModal';

const rowStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-3)',
};

function RenameForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
        }}
        className="font-mono text-xs text-foreground"
        style={{ ...inputStyle, width: 'auto', flex: 1 }}
        autoFocus
      />
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSave}
          disabled={saving || value.trim() === ''}
          className="font-mono text-[10px] text-accent bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? '…' : 'save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="font-mono text-[10px] text-muted-3 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          cancel
        </button>
      </div>
    </>
  );
}

function EventTypeRow({
  eventType,
  disabled,
  isBusy,
  onRename,
  onDelete,
}: {
  eventType: EventType;
  /** True while ANY row in the modal is being mutated — disables this row's actions so two
   * mutations can't race. */
  disabled: boolean;
  /** True only when THIS row is the one currently being mutated — drives the delete button's own
   * spinner label. */
  isBusy: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="min-w-0">
        <span className="font-mono text-xs font-semibold text-foreground">{eventType.type}</span>
        <span className="font-mono text-[10px] ml-2 text-muted-3">
          {eventType.eventCount} event{eventType.eventCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRename}
          disabled={disabled}
          className="font-mono text-[10px] text-muted bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          rename
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="font-mono text-[10px] text-danger bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isBusy ? '…' : '✕ remove'}
        </button>
      </div>
    </>
  );
}

/** Adds/renames/removes entries from a research domain's registered event-type taxonomy
 * (`@quant-fusion/research-store`'s `event_types`, via `/api/research/:domain/event-types`) — the
 * options the Add Event modal's type dropdown offers. Renaming or removing a type here never
 * touches any event already recorded with the old type string — see that table's own doc comment
 * for why; this only changes what a NEW event can be tagged with. State/handlers live in
 * `useManageEventTypesModal` — this component only renders. */
export default function ManageEventTypesModal({
  open,
  onClose,
  domain,
  eventTypes,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  eventTypes: EventType[];
  onChanged: () => void;
}) {
  const {
    newType,
    setNewType,
    renamingType,
    renameValue,
    setRenameValue,
    busyType,
    error,
    handleAdd,
    startRename,
    cancelRename,
    handleRename,
    handleDelete,
  } = useManageEventTypesModal({ domain, onChanged });

  return (
    <Modal open={open} onClose={onClose} title="Manage Event Types">
      <p className="font-mono text-[10px] leading-relaxed text-muted-3">
        Which types the Add Event modal offers — renaming or removing one here never changes any
        event already recorded with the old type.
      </p>

      {eventTypes.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No event types registered yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {eventTypes.map((t) => (
            <div
              key={t.type}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[2px]"
              style={rowStyle}
            >
              {renamingType === t.type ? (
                <RenameForm
                  value={renameValue}
                  onChange={setRenameValue}
                  onSave={() => {
                    void handleRename();
                  }}
                  onCancel={cancelRename}
                  saving={busyType === t.type}
                />
              ) : (
                <EventTypeRow
                  eventType={t}
                  disabled={busyType !== undefined}
                  isBusy={busyType === t.type}
                  onRename={() => {
                    startRename(t.type);
                  }}
                  onDelete={() => {
                    void handleDelete(t.type);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="flex flex-col gap-2 pt-3"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Add a type
        </span>
        <input
          value={newType}
          onChange={(e) => {
            setNewType(e.target.value.toUpperCase());
          }}
          placeholder="e.g. SUPPLIER_QUALIFIED"
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
        {error !== undefined && <p className="font-mono text-[10px] text-danger">{error}</p>}
        <button
          onClick={() => {
            void handleAdd();
          }}
          disabled={busyType !== undefined || newType.trim() === ''}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer self-start disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {busyType === newType.trim() ? 'Adding…' : '+ Add Type'}
        </button>
      </div>

      <div
        className="flex items-center justify-end pt-2"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <button
          onClick={onClose}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
