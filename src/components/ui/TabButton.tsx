export default function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-xs px-5 py-3 tracking-wider transition-all border-t-0 border-x-0 border-b-2 bg-transparent cursor-pointer ${
        active ? 'text-accent border-accent' : 'text-muted-3 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}
