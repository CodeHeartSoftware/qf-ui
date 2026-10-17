import Dropdown from '@/components/ui/Dropdown';
import { formatSlug } from '@/utils/format';
import type { Evidence, ResearchDataset, ResearchEntity, ResearchEvent } from '@/hooks/apiTypes';
import AddEventModal from './AddEventModal';
import EventCard from './EventCard';
import ManageEventTypesModal from './ManageEventTypesModal';
import { ALL_TYPES_VALUE, useEventTimeline } from './useEventTimeline';

const dateInputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
};

/** Renamed from the template's `MilestoneTimeline` — a research-core `ResearchEvent` has a
 * domain-defined `type` string and an arbitrary `payload` record, not the template's fixed
 * milestone `type`/`significance` enum, so there's no fixed color-per-type map (uses the same
 * collision-free `colorForSlug` registry as the rest of this tab instead) and no separate
 * human-written title — the participant entities stand in for the template's `m.title` line,
 * since that's the one piece of this event that isn't just a re-casing of its own type tag.
 *
 * Each event renders as its own card — the same outer chrome `HypothesisCard` uses (bordered
 * background box, corner radius, list gap) — rather than a bare row under a connecting spine
 * line, so the two tabs read as the same family of component. A small colored dot next to the
 * date keeps the "this is a point in time" cue that the spine used to carry, without implying a
 * continuous line across what are now separate boxes — the same dot `HypothesisCard`'s own
 * nested assessment timeline uses for the same reason. State/handlers live in `useEventTimeline`
 * — this component only renders. */
export default function EventTimeline({
  events,
  entitiesById,
  evidenceById,
  domain,
  dataset,
  onChanged,
}: {
  events: ResearchEvent[];
  entitiesById: Map<string, ResearchEntity>;
  evidenceById: Map<string, Evidence>;
  domain: string;
  dataset: ResearchDataset;
  onChanged: () => void;
}) {
  const {
    selectedType,
    setSelectedType,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    typeCounts,
    sorted,
    hasDateFilter,
    clearDateFilter,
    addOpen,
    openAdd,
    closeAdd,
    eventTypes,
    refetchEventTypes,
    manageTypesOpen,
    openManageTypes,
    closeManageTypes,
  } = useEventTimeline(events, domain);

  const addEventButton = (
    <>
      <button
        onClick={openAdd}
        className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
      >
        + Add Event
      </button>
      <AddEventModal
        open={addOpen}
        onClose={closeAdd}
        domain={domain}
        dataset={dataset}
        eventTypes={eventTypes}
        onSuccess={() => {
          closeAdd();
          onChanged();
        }}
      />
    </>
  );

  const manageTypesButton = (
    <>
      <button
        onClick={openManageTypes}
        className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
      >
        Manage Event Types
      </button>
      <ManageEventTypesModal
        open={manageTypesOpen}
        onClose={closeManageTypes}
        domain={domain}
        eventTypes={eventTypes}
        onChanged={refetchEventTypes}
      />
    </>
  );

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end items-center gap-2">
          {manageTypesButton}
          {addEventButton}
        </div>
        <p className="font-mono text-xs text-muted-3">No events for this dataset.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Dropdown
            options={[
              { value: ALL_TYPES_VALUE, label: `Any Type (${String(events.length)})` },
              ...typeCounts.map(([type, count]) => ({
                value: type,
                label: `${formatSlug(type.toLowerCase())} (${String(count)})`,
              })),
            ]}
            selectedValue={selectedType}
            onSelect={setSelectedType}
          />
          {manageTypesButton}
        </div>
        <div className="flex flex-col justify-end gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
              Date
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
              }}
              className="font-mono text-[11px] text-muted"
              style={dateInputStyle}
            />
            <span className="font-mono text-[10px] text-muted-4">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
              className="font-mono text-[11px] text-muted"
              style={dateInputStyle}
            />
          </div>
          <div className="flex justify-end">{addEventButton}</div>
          {hasDateFilter && (
            <button
              onClick={clearDateFilter}
              className="font-mono text-[9px] uppercase tracking-widest text-muted-3 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No events match these filters.</p>
      ) : (
        sorted.map((e) => (
          <EventCard key={e.id} event={e} entitiesById={entitiesById} evidenceById={evidenceById} />
        ))
      )}
    </div>
  );
}
