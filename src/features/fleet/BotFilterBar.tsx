export type FleetFilter = 'all' | 'active' | 'inactive';

const FILTERS: { id: FleetFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'active', label: 'ACTIVE' },
  { id: 'inactive', label: 'INACTIVE' },
];

export default function BotFilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: FleetFilter;
  onFilterChange: (filter: FleetFilter) => void;
  counts: Record<FleetFilter, number>;
}) {
  return (
    <div className="flex gap-2 mb-6">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => {
            onFilterChange(f.id);
          }}
          className={`font-mono text-xs px-3 py-1.5 rounded-[1px] border transition-all cursor-pointer ${
            activeFilter === f.id
              ? 'border-accent text-accent bg-accent-subtle-bg'
              : 'border-border text-muted-2 bg-transparent'
          }`}
          style={{ letterSpacing: '0.06em' }}
        >
          {f.label} ({counts[f.id]})
        </button>
      ))}
    </div>
  );
}
