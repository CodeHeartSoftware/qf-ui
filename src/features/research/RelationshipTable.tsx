import Tag from '@/components/ui/Tag';
import { colorForSlug, formatSlug } from '@/utils/format';
import type { Evidence, ResearchEntity, ResearchRelationship } from '@/hooks/apiTypes';
import DeleteItemButton from './DeleteItemButton';
import EvidenceCitation, { resolveEvidence } from './EvidenceCitation';

/** Replaces the template's `SupplyChainGraph` — that component's x/y node layout was fabricated
 * mock data with no analog in `research-core`'s generic `ResearchRelationship` (from/to entity
 * ids plus a time-varying `states` list, no graph coordinates). See `RelationshipGraph` for the
 * real (force-layout-computed, not fabricated) graph view this pairs with. Each row stacks its
 * fields vertically (relationship, then type/state tags, then source) rather than a
 * column-aligned grid — with names/tags/sources all varying widely in length, a fixed-column
 * layout left a lot of dead space; sorted by entity name rather than raw dataset order. */
export default function RelationshipTable({
  relationships,
  entitiesById,
  evidenceById,
  domain,
  onAddState,
  onChanged,
}: {
  relationships: ResearchRelationship[];
  entitiesById: Map<string, ResearchEntity>;
  evidenceById: Map<string, Evidence>;
  domain: string;
  onAddState: (relationship: ResearchRelationship) => void;
  onChanged: () => void;
}) {
  if (relationships.length === 0) {
    return <p className="font-mono text-xs text-muted-3">No relationships of this type.</p>;
  }

  const nameOf = (id: string): string => entitiesById.get(id)?.name ?? id;
  const sorted = [...relationships].sort((a, b) =>
    nameOf(a.fromEntityId).localeCompare(nameOf(b.fromEntityId)),
  );

  return (
    <div style={{ border: '1px solid var(--color-border-3)', borderRadius: 2, overflow: 'hidden' }}>
      {sorted.map((r, i) => {
        const current = [...r.states].sort((a, b) =>
          b.effectiveFrom.localeCompare(a.effectiveFrom),
        )[0];
        const cited = resolveEvidence(current?.evidenceIds ?? [], evidenceById);

        return (
          <div
            key={r.id}
            className="flex flex-col gap-1.5 px-4 py-3"
            style={{
              background: i % 2 === 0 ? 'var(--color-surface)' : '#0b0b0b',
              borderTop: i === 0 ? undefined : '1px solid var(--color-border-3)',
            }}
          >
            <div className="flex items-center gap-1.5 font-mono text-xs leading-none">
              <span className="text-foreground">{nameOf(r.fromEntityId)}</span>
              <span className="text-muted-4">→</span>
              <span className="text-foreground">{nameOf(r.toEntityId)}</span>
            </div>

            <div>
              <Tag label={formatSlug(r.type)} color={colorForSlug(r.type)} />
            </div>

            {current !== undefined && (
              <div className="font-mono text-[10px] leading-none text-muted-2">
                {formatSlug(current.status)}
              </div>
            )}

            <EvidenceCitation
              cited={cited}
              className="leading-none"
              emptyFallback={
                <span className="font-mono text-[10px] text-muted-4">No cited source</span>
              }
            />

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => {
                  onAddState(r);
                }}
                className="font-mono text-[10px] bg-transparent cursor-pointer text-muted-3"
              >
                + add state
              </button>
              <DeleteItemButton
                domain={domain}
                collection="relationships"
                id={r.id}
                onDeleted={onChanged}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
