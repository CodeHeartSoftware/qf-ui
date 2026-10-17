export default function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
      style={{
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </span>
  );
}
