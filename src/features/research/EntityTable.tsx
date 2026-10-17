import Dropdown from '@/components/ui/Dropdown';
import Tag from '@/components/ui/Tag';
import { colorForSlug, formatSlug } from '@/utils/format';
import type { ResearchEntity } from '@/hooks/apiTypes';
import DeleteItemButton from './DeleteItemButton';
import EntityFormModal from './EntityFormModal';
import ManageEntityTypesModal from './ManageEntityTypesModal';
import { ALL_TYPES_VALUE, useEntityTable } from './useEntityTable';

export default function EntityTable({
  entities,
  domain,
  onChanged,
}: {
  entities: ResearchEntity[];
  domain: string;
  onChanged: () => void;
}) {
  const {
    selectedType,
    setSelectedType,
    sort,
    toggleSort,
    typeCounts,
    visibleEntities,
    addOpen,
    openAdd,
    closeAdd,
    editingEntity,
    setEditingEntity,
    entityTypes,
    refetchEntityTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  } = useEntityTable(entities, domain);

  const addButton = (
    <button
      onClick={openAdd}
      className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
    >
      + Add Entity
    </button>
  );
  const manageTypesButton = (
    <button
      onClick={openManageTypes}
      className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
    >
      Manage Entity Types
    </button>
  );
  const modals = (
    <>
      <EntityFormModal
        open={addOpen}
        onClose={closeAdd}
        domain={domain}
        entityTypes={entityTypes}
        onSuccess={() => {
          closeAdd();
          onChanged();
        }}
        onChanged={onChanged}
      />
      <EntityFormModal
        open={editingEntity !== undefined}
        onClose={() => {
          setEditingEntity(undefined);
        }}
        domain={domain}
        entity={editingEntity}
        entityTypes={entityTypes}
        onSuccess={() => {
          setEditingEntity(undefined);
          onChanged();
        }}
        onChanged={onChanged}
      />
      <ManageEntityTypesModal
        open={manageTypesOpen}
        onClose={closeManageTypes}
        domain={domain}
        entityTypes={entityTypes}
        onChanged={refetchEntityTypes}
      />
    </>
  );

  if (entities.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end items-center gap-2">
          {manageTypesButton}
          {addButton}
        </div>
        <p className="font-mono text-xs text-muted-3">No entities of this type.</p>
        {modals}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Dropdown
            options={[
              { value: ALL_TYPES_VALUE, label: `Any Type (${String(entities.length)})` },
              ...typeCounts.map(([type, count]) => ({
                value: type,
                label: `${formatSlug(type)} (${String(count)})`,
              })),
            ]}
            selectedValue={selectedType}
            onSelect={setSelectedType}
          />
          {manageTypesButton}
        </div>
        {addButton}
      </div>

      <div
        style={{ border: '1px solid var(--color-border-3)', borderRadius: 2, overflow: 'hidden' }}
      >
        <div
          className="grid font-mono text-[9px] tracking-widest uppercase"
          style={{
            gridTemplateColumns: '1fr 160px 120px',
            background: 'var(--color-surface-3)',
            color: 'var(--color-muted-3)',
          }}
        >
          <button
            onClick={() => {
              toggleSort('name');
            }}
            className="flex items-center gap-1 px-4 py-2 text-left bg-transparent border-0 cursor-pointer font-mono text-[9px] tracking-widest uppercase"
            style={{ color: sort.column === 'name' ? '#888' : 'var(--color-muted-3)' }}
          >
            Entity ({visibleEntities.length})
            {sort.column === 'name' && <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>}
          </button>
          <button
            onClick={() => {
              toggleSort('type');
            }}
            className="flex items-center gap-1 px-4 py-2 text-left bg-transparent border-0 cursor-pointer font-mono text-[9px] tracking-widest uppercase"
            style={{ color: sort.column === 'type' ? '#888' : 'var(--color-muted-3)' }}
          >
            Type
            {sort.column === 'type' && <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>}
          </button>
          <span className="px-4 py-2" />
        </div>
        {visibleEntities.map((e, i) => (
          <div
            key={e.id}
            className="grid items-start px-4 py-3 gap-2"
            style={{
              gridTemplateColumns: '1fr 160px 120px',
              background: i % 2 === 0 ? 'var(--color-surface)' : '#0b0b0b',
            }}
          >
            <div className="min-w-0">
              <span className="font-mono text-xs font-semibold text-foreground">{e.name}</span>
              {e.description !== undefined && (
                <p className="font-mono text-[10px] mt-0.5 leading-relaxed text-muted-2">
                  {e.description}
                </p>
              )}
            </div>
            <div>
              <Tag label={formatSlug(e.type)} color={colorForSlug(e.type)} />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingEntity(e);
                }}
                className="font-mono text-[10px] bg-transparent cursor-pointer text-muted-3"
              >
                edit
              </button>
              <DeleteItemButton
                domain={domain}
                collection="entities"
                id={e.id}
                onDeleted={onChanged}
              />
            </div>
          </div>
        ))}
      </div>
      {modals}
    </div>
  );
}
