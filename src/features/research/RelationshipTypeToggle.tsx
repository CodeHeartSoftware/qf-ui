export default function RelationshipTypeToggle({
  label,
  color,
  selected,
  onClick,
}: {
  label: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono text-[9px] font-bold px-2 py-1 rounded-sm cursor-pointer transition-all"
      style={{
        background: selected ? `${color}22` : 'transparent',
        color: selected ? color : 'var(--color-muted-3)',
        border: `1px solid ${selected ? `${color}55` : 'var(--color-border-2)'}`,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </button>
  );
}
