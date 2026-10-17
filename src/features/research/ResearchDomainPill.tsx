import type { ResearchDomainSummary } from '@/hooks/apiTypes';

/** One entry in the research-domain sidebar — a real registered domain (see
 * `apps/api/src/routes/research.ts`'s own domain registry), not a fabricated
 * "industry grouping." New research packages show up here automatically as they're added to
 * that registry. */
export default function ResearchDomainPill({
  domain,
  selected,
  onClick,
}: {
  domain: ResearchDomainSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 p-3 text-left transition-all w-full cursor-pointer"
      style={{
        background: selected ? 'var(--color-accent-subtle-bg)' : 'var(--color-surface)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-2)'}`,
        borderRadius: 2,
      }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase"
        style={{
          color: selected ? 'var(--color-accent)' : 'var(--color-muted)',
          letterSpacing: '0.08em',
        }}
      >
        {domain.domain}
      </span>
      <span
        className="font-mono text-xs leading-tight"
        style={{ color: selected ? 'var(--color-foreground)' : 'var(--color-muted-2)' }}
      >
        {domain.name}
      </span>
      <div className="flex gap-3 mt-0.5">
        <span className="font-mono text-[9px] text-muted-4">{domain.entityCount} entities</span>
        <span className="font-mono text-[9px] text-muted-4">
          {domain.relationshipCount} relationships
        </span>
      </div>
    </button>
  );
}
