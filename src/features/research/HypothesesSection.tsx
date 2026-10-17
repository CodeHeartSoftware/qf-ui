import { useMemo, useState } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import { formatSlug } from '@/utils/format';
import type { Evidence, ResearchHypothesis } from '@/hooks/apiTypes';
import HypothesisCard from './HypothesisCard';
import HypothesisFormModal from './HypothesisFormModal';

const ALL_STATUSES_VALUE = '__all__';

type SortColumn = 'updated' | 'confidence' | 'name';
type SortDirection = 'asc' | 'desc';

const SORT_OPTIONS: { column: SortColumn; label: string }[] = [
  { column: 'confidence', label: 'Confidence' },
  { column: 'updated', label: 'Last Updated' },
  { column: 'name', label: 'Name' },
];

/** `h.assessments` isn't guaranteed sorted (research-core allows out-of-order entries, see its
 * own `findDuplicateAssessmentTimestamps` doc comment), so every reader needing "the latest one"
 * re-derives it rather than assuming array order — same convention `HypothesisCard` itself uses. */
function latestAssessment(h: ResearchHypothesis) {
  return [...h.assessments].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

export default function HypothesesSection({
  hypotheses,
  evidenceById,
  domain,
  onChanged,
}: {
  hypotheses: ResearchHypothesis[];
  evidenceById: Map<string, Evidence>;
  domain: string;
  onChanged: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUSES_VALUE);
  const [addOpen, setAddOpen] = useState(false);
  // Defaults to most-recently-updated first — for a list whose whole point is "what's our
  // current thinking," that's a more useful first look than alphabetical.
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'confidence',
    direction: 'desc',
  });

  const toggleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: column === 'name' ? 'asc' : 'desc' },
    );
  };

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of hypotheses) counts.set(h.status, (counts.get(h.status) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [hypotheses]);

  const visibleHypotheses = useMemo(() => {
    const filtered =
      selectedStatus === ALL_STATUSES_VALUE
        ? hypotheses
        : hypotheses.filter((h) => h.status === selectedStatus);
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.column === 'name') return a.name.localeCompare(b.name) * sign;
      if (sort.column === 'confidence') {
        // A hypothesis with no assessments yet sorts as if it had the lowest possible
        // confidence, rather than being placed arbitrarily by insertion order.
        const aValue = latestAssessment(a)?.confidence.value ?? -1;
        const bValue = latestAssessment(b)?.confidence.value ?? -1;
        return (aValue - bValue) * sign;
      }
      const aTimestamp = latestAssessment(a)?.timestamp ?? a.createdAt;
      const bTimestamp = latestAssessment(b)?.timestamp ?? b.createdAt;
      return aTimestamp.localeCompare(bTimestamp) * sign;
    });
  }, [hypotheses, selectedStatus, sort]);

  const addButton = (
    <button
      onClick={() => {
        setAddOpen(true);
      }}
      className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer shrink-0"
    >
      + Add Hypothesis
    </button>
  );
  const addModal = (
    <HypothesisFormModal
      open={addOpen}
      onClose={() => {
        setAddOpen(false);
      }}
      domain={domain}
      onSuccess={() => {
        setAddOpen(false);
        onChanged();
      }}
    />
  );

  if (hypotheses.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">{addButton}</div>
        <p className="font-mono text-xs text-muted-3">No hypotheses for this dataset.</p>
        {addModal}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <Dropdown
          options={[
            { value: ALL_STATUSES_VALUE, label: `Any Status (${String(hypotheses.length)})` },
            ...statusCounts.map(([status, count]) => ({
              value: status,
              label: `${formatSlug(status)} (${String(count)})`,
            })),
          ]}
          selectedValue={selectedStatus}
          onSelect={setSelectedStatus}
        />
        <div className="flex flex-col items-end justify-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
              Sort
            </span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.column}
                onClick={() => {
                  toggleSort(opt.column);
                }}
                className="font-mono text-[10px] px-2.5 py-1.5 rounded-[1px] border bg-transparent cursor-pointer flex items-center gap-1"
                style={{
                  borderColor:
                    sort.column === opt.column ? 'var(--color-accent)' : 'var(--color-border-4)',
                  color:
                    sort.column === opt.column ? 'var(--color-accent)' : 'var(--color-muted-2)',
                }}
              >
                {opt.label}
                {sort.column === opt.column && <span>{sort.direction === 'asc' ? '▲' : '▼'}</span>}
              </button>
            ))}
          </div>
          {addButton}
        </div>
      </div>

      {visibleHypotheses.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No hypotheses have this status.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleHypotheses.map((h) => (
            <HypothesisCard
              key={h.id}
              h={h}
              evidenceById={evidenceById}
              domain={domain}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
      {addModal}
    </div>
  );
}
