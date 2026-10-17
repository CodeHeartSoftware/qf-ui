/** A checkbox row styled to match this app's own toggle chrome (`SectionToggle`'s accent-tinted
 * selected state, `RelationshipTypeToggle`'s dark checkmark-on-accent contrast) rather than a bare
 * native checkbox, which reads as stock/unstyled next to everything else in this app. Still a
 * real `<input type="checkbox">` under the hood (visually hidden, not removed) so click-anywhere-
 * in-the-row, keyboard toggling, and screen-reader semantics all keep working — only the visible
 * box is a custom `<span>` driven by the same `checked` boolean. */
function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-2 py-1.5 rounded-[2px] cursor-pointer transition-colors ${checked ? '' : 'hover:bg-surface-2'}`}
      style={checked ? { background: 'var(--color-accent-subtle-bg)' } : undefined}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        className="flex items-center justify-center shrink-0 transition-colors"
        style={{
          width: 13,
          height: 13,
          borderRadius: 3,
          border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-4)'}`,
          background: checked ? 'var(--color-accent)' : 'transparent',
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="var(--color-background)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        className="font-mono text-[11px] truncate"
        style={{ color: checked ? 'var(--color-foreground)' : 'var(--color-muted-2)' }}
      >
        {label}
      </span>
    </label>
  );
}

/** A scrollable, bordered list of `CheckboxRow`s — originally `AddEventModal.tsx`'s own
 * entity/evidence picker, promoted here once `CreateMatchModal.tsx`'s own bot picker needed the
 * identical shape (per `frontend-conventions`'s own rule: promote once a second feature needs
 * it). */
export default function CheckboxList<T extends { id: string }>({
  items,
  selectedIds,
  labelFor,
  onToggle,
  maxHeightClassName,
  emptyMessage,
}: {
  items: T[];
  selectedIds: Set<string>;
  labelFor: (item: T) => string;
  onToggle: (id: string) => void;
  maxHeightClassName: string;
  emptyMessage?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 overflow-y-auto ${maxHeightClassName}`}
      style={{ border: '1px solid var(--color-border-4)', borderRadius: 2, padding: 6 }}
    >
      {items.length === 0 && emptyMessage !== undefined ? (
        <p className="font-mono text-[10px] text-muted-4">{emptyMessage}</p>
      ) : (
        items.map((item) => (
          <CheckboxRow
            key={item.id}
            checked={selectedIds.has(item.id)}
            label={labelFor(item)}
            onToggle={() => {
              onToggle(item.id);
            }}
          />
        ))
      )}
    </div>
  );
}
