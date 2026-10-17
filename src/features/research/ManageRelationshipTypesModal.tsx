import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import {
  isRelationshipTypeCategory,
  RELATIONSHIP_TYPE_CATEGORIES,
  type RelationshipType,
} from '@/hooks/apiTypes';
import { inputStyle } from './researchFormShared';
import { useManageRelationshipTypesModal } from './useManageRelationshipTypesModal';

const rowStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-3)',
};

const NONE_CATEGORY_VALUE = '__none__';
const CATEGORY_OPTIONS = [
  { value: NONE_CATEGORY_VALUE, label: 'Uncategorized' },
  ...RELATIONSHIP_TYPE_CATEGORIES.map((category) => ({ value: category, label: category })),
];

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
          onChange(e.target.value);
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

function RelationshipTypeRow({
  relationshipType,
  disabled,
  isBusy,
  onRename,
  onSetCategory,
  onDelete,
}: {
  relationshipType: RelationshipType;
  /** True while ANY row in the modal is being mutated — disables this row's actions so two
   * mutations can't race. */
  disabled: boolean;
  /** True only when THIS row is the one currently being mutated — drives the delete button's own
   * spinner label. */
  isBusy: boolean;
  onRename: () => void;
  onSetCategory: (value: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="min-w-0 flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs font-semibold text-foreground">
          {relationshipType.type}
        </span>
        <span className="font-mono text-[10px] text-muted-3">
          {relationshipType.relationshipCount} relationship
          {relationshipType.relationshipCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Dropdown
          options={CATEGORY_OPTIONS}
          selectedValue={relationshipType.category ?? NONE_CATEGORY_VALUE}
          onSelect={onSetCategory}
        />
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

/** Adds/renames/removes entries from a research domain's registered relationship-type taxonomy
 * (`@quant-fusion/research-store`'s `relationship_types`, via
 * `/api/research/:domain/relationship-types`) — the options the Add Relationship modal's type
 * dropdown offers. Renaming or removing a type here never touches any relationship already
 * recorded with the old type string — see that table's own doc comment for why; this only
 * changes what a NEW relationship can be tagged with (`research-core` has no "edit a
 * relationship's type in place" concept, so this never affects an existing one anyway).
 *
 * A type can also be SORTED into one of the Quant tab's own pre-existing Exposure Map categories
 * (manufacturing/qualification/contract/program — never an arbitrary label; the dropdown offers
 * exactly these four plus "Uncategorized") — this actually moves that type's relationships into
 * the corresponding real `ExposureMapCard`, correcting cases where `computeExposureMap`'s own
 * regex/status-text classification misses or misfiles a type (e.g. a `customer_contract`
 * relationship whose status text doesn't literally say "contract"). Never read by the real quant
 * bot's own exposure computation elsewhere (e.g. Thesis Groups) — see
 * `@quant-fusion/research-store`'s `relationship_types.category` column doc comment.
 *
 * State/handlers live in `useManageRelationshipTypesModal` — this component only renders. */
export default function ManageRelationshipTypesModal({
  open,
  onClose,
  domain,
  relationshipTypes,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  relationshipTypes: RelationshipType[];
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
    handleSetCategory,
    handleDelete,
  } = useManageRelationshipTypesModal({ domain, onChanged });

  return (
    <Modal open={open} onClose={onClose} title="Manage Relationship Types">
      <p className="font-mono text-[10px] leading-relaxed text-muted-3">
        Which types the Add Relationship modal offers — renaming or removing one here never changes
        any relationship already recorded with the old type. Sorting a type into a category moves
        its relationships into that Exposure Map card on the Quant tab.
      </p>

      {relationshipTypes.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No relationship types registered yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {relationshipTypes.map((t) => (
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
                <RelationshipTypeRow
                  relationshipType={t}
                  disabled={busyType !== undefined}
                  isBusy={busyType === t.type}
                  onRename={() => {
                    startRename(t.type);
                  }}
                  onSetCategory={(value) => {
                    void handleSetCategory(
                      t.type,
                      isRelationshipTypeCategory(value) ? value : null,
                    );
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
            setNewType(e.target.value);
          }}
          placeholder="e.g. supplies"
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
