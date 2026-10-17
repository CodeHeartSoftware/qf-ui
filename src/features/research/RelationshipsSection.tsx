import Dropdown from '@/components/ui/Dropdown';
import { colorForSlug, formatSlug } from '@/utils/format';
import type {
  Evidence,
  ResearchDataset,
  ResearchEntity,
  ResearchRelationship,
} from '@/hooks/apiTypes';
import ManageRelationshipTypesModal from './ManageRelationshipTypesModal';
import RelationshipFormModal from './RelationshipFormModal';
import RelationshipGraph from './RelationshipGraph';
import RelationshipTable from './RelationshipTable';
import RelationshipTypeToggle from './RelationshipTypeToggle';
import { ANY_ENTITY_VALUE, useRelationshipsSection } from './useRelationshipsSection';

/** A multi-select toggle (mirroring the template's own multi-select group toggle, "click to
 * enable/disable") drives both the graph and the table below it, so narrowing to e.g. "supplies"
 * + "manufactures" shows the same edge set in both views — unlike a single-select dropdown, more
 * than one type can be shown together, which is what the graph actually benefits from.
 * State/handlers live in `useRelationshipsSection` — this component only renders. */
export default function RelationshipsSection({
  relationships,
  entitiesById,
  evidenceById,
  domain,
  dataset,
  onChanged,
}: {
  relationships: ResearchRelationship[];
  entitiesById: Map<string, ResearchEntity>;
  evidenceById: Map<string, Evidence>;
  domain: string;
  dataset: ResearchDataset;
  onChanged: () => void;
}) {
  const {
    addOpen,
    openAdd,
    closeAdd,
    addingStateTo,
    setAddingStateTo,
    typeCounts,
    selectedTypes,
    setSelectedTypes,
    toggleType,
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    fromOptions,
    toOptions,
    filteredRelationships,
    relationshipTypes,
    refetchRelationshipTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  } = useRelationshipsSection(relationships, entitiesById, domain);

  const addButton = (
    <button
      onClick={openAdd}
      className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
    >
      + Add Relationship
    </button>
  );
  const manageTypesButton = (
    <button
      onClick={openManageTypes}
      className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
    >
      Manage Relationship Types
    </button>
  );
  const modals = (
    <>
      <RelationshipFormModal
        open={addOpen}
        onClose={closeAdd}
        domain={domain}
        dataset={dataset}
        relationshipTypes={relationshipTypes}
        onSuccess={() => {
          closeAdd();
          onChanged();
        }}
        onChanged={onChanged}
      />
      <RelationshipFormModal
        open={addingStateTo !== undefined}
        onClose={() => {
          setAddingStateTo(undefined);
        }}
        domain={domain}
        dataset={dataset}
        relationship={addingStateTo}
        relationshipTypes={relationshipTypes}
        onSuccess={() => {
          setAddingStateTo(undefined);
          onChanged();
        }}
        onChanged={onChanged}
      />
      <ManageRelationshipTypesModal
        open={manageTypesOpen}
        onClose={closeManageTypes}
        domain={domain}
        relationshipTypes={relationshipTypes}
        onChanged={refetchRelationshipTypes}
      />
    </>
  );

  if (relationships.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end items-center gap-2">
          {manageTypesButton}
          {addButton}
        </div>
        <p className="font-mono text-xs text-muted-3">No relationships for this dataset.</p>
        {modals}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">{manageTypesButton}</div>
          <div className="flex flex-row-reverse gap-2">
            {addButton}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedTypes(new Set());
                }}
                className="font-mono text-[9px] uppercase tracking-widest text-muted-3 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setSelectedTypes(new Set(typeCounts.map(([type]) => type)));
                }}
                className="font-mono text-[9px] uppercase tracking-widest text-muted-3 cursor-pointer"
              >
                Select All
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {typeCounts.map(([type, count]) => (
            <RelationshipTypeToggle
              key={type}
              label={`${formatSlug(type)} (${String(count)})`}
              color={colorForSlug(type)}
              selected={selectedTypes.has(type)}
              onClick={() => {
                toggleType(type);
              }}
            />
          ))}
        </div>
      </div>
      <RelationshipGraph relationships={filteredRelationships} entitiesById={entitiesById} />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">From</span>
        <Dropdown
          options={[
            { value: ANY_ENTITY_VALUE, label: 'Any' },
            ...fromOptions.map((o) => ({ value: o.id, label: `${o.name} (${String(o.count)})` })),
          ]}
          selectedValue={fromFilter}
          onSelect={setFromFilter}
        />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">To</span>
        <Dropdown
          options={[
            { value: ANY_ENTITY_VALUE, label: 'Any' },
            ...toOptions.map((o) => ({ value: o.id, label: `${o.name} (${String(o.count)})` })),
          ]}
          selectedValue={toFilter}
          onSelect={setToFilter}
        />
        {(fromFilter !== ANY_ENTITY_VALUE || toFilter !== ANY_ENTITY_VALUE) && (
          <button
            onClick={() => {
              setFromFilter(ANY_ENTITY_VALUE);
              setToFilter(ANY_ENTITY_VALUE);
            }}
            className="font-mono text-[9px] uppercase tracking-widest text-muted-3 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      <RelationshipTable
        relationships={filteredRelationships}
        entitiesById={entitiesById}
        evidenceById={evidenceById}
        domain={domain}
        onAddState={setAddingStateTo}
        onChanged={onChanged}
      />
      {modals}
    </div>
  );
}
