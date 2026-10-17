import Tag from '@/components/ui/Tag';
import { colorForSlug, formatSlug } from '@/utils/format';
import type { Evidence, ResearchEntity, ResearchEvent } from '@/hooks/apiTypes';
import EvidenceCitation, { resolveEvidence } from './EvidenceCitation';

/** One event's own card — extracted out of `EventTimeline`'s `.map`, matching how `HypothesisCard`
 * and `fleet/BotCard.tsx` are their own components rather than markup left inline in a list
 * (`frontend-conventions`'s own rule on any mapped list item with real markup). The colored dot
 * next to the date is the same "this is a point in time" cue `HypothesisCard`'s own assessment
 * timeline uses. */
export default function EventCard({
  event,
  entitiesById,
  evidenceById,
}: {
  event: ResearchEvent;
  entitiesById: Map<string, ResearchEntity>;
  evidenceById: Map<string, Evidence>;
}) {
  const color = colorForSlug(event.type);
  const entityNames = event.entityIds.map((id) => entitiesById.get(id)?.name ?? id);
  const cited = resolveEvidence(event.evidenceIds, evidenceById);

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
        <span className="font-mono text-[10px] text-muted-2">{event.timestamp.slice(0, 10)}</span>
        <Tag label={formatSlug(event.type.toLowerCase())} color={color} />
      </div>
      {entityNames.length > 0 && (
        <p className="font-mono text-sm font-semibold text-foreground">{entityNames.join(' · ')}</p>
      )}
      {Object.entries(event.payload).length > 0 && (
        <p className="font-mono text-[11px] mt-1 leading-relaxed text-muted">
          {Object.entries(event.payload)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(' · ')}
        </p>
      )}
      <EvidenceCitation cited={cited} className="mt-1.5" />
    </div>
  );
}
