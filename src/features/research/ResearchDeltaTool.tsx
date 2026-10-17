import { useState, type ReactNode } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import Tag from '@/components/ui/Tag';
import { useResearchDeltaTool } from '@/hooks/useQuantAnalysis';
import { colorForSlug, formatPercent, formatSlug } from '@/utils/format';
import type {
  Evidence,
  HypothesisChange,
  ModelEffect,
  RelationshipChange,
  ResearchEntity,
  ResearchEvent,
  ResearchDelta,
} from '@/hooks/apiTypes';

const dateInputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
};

function directionColor(direction: ModelEffect['direction']): string {
  if (direction === 'positive') return 'var(--color-accent)';
  if (direction === 'negative') return 'var(--color-danger)';
  return 'var(--color-muted-3)';
}

function EffectCard({ effect }: { effect: ModelEffect }) {
  return (
    <div
      className="p-3 flex flex-col gap-1.5"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Tag label={effect.factor} color={colorForSlug(effect.factor)} />
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: directionColor(effect.direction) }}
        >
          {effect.direction}
        </span>
        <span className="font-mono text-[10px] text-muted-4">
          magnitude {effect.magnitude.toFixed(2)} · confidence {effect.confidence.toFixed(2)}
        </span>
        {effect.scope !== undefined && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            [{effect.scope}]
          </span>
        )}
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-muted">{effect.rationale}</p>
    </div>
  );
}

/** A short, plain-English narration of `delta`'s own counts — the ONE sentence the rest of the
 * card exists to substantiate. Only mentions categories that actually changed, so "nothing
 * changed" reads as one clean sentence rather than "0 of everything." */
function summarizeDelta(
  delta: ResearchDelta,
  entityName: string,
  fromDate: string,
  toDate: string,
): string {
  if (delta.isEmpty) {
    return `No research changes recorded for ${entityName} between ${fromDate} and ${toDate}.`;
  }
  const parts: string[] = [];
  if (delta.newEvidence.length > 0) {
    parts.push(
      `${String(delta.newEvidence.length)} new evidence item${delta.newEvidence.length === 1 ? '' : 's'}`,
    );
  }
  if (delta.changedRelationships.length > 0) {
    parts.push(
      `${String(delta.changedRelationships.length)} relationship change${delta.changedRelationships.length === 1 ? '' : 's'}`,
    );
  }
  if (delta.changedHypotheses.length > 0) {
    parts.push(
      `${String(delta.changedHypotheses.length)} hypothesis reassessment${delta.changedHypotheses.length === 1 ? '' : 's'}`,
    );
  }
  if (delta.newEvents.length > 0) {
    parts.push(
      `${String(delta.newEvents.length)} new event${delta.newEvents.length === 1 ? '' : 's'}`,
    );
  }
  const list =
    parts.length <= 1
      ? (parts[0] ?? '')
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] ?? ''}`;
  return `${entityName} had ${list} between ${fromDate} and ${toDate}.`;
}

const RELATIONSHIP_TABLE_COLUMNS = '1fr 130px 1fr 1.3fr';

/** A compact, column-aligned table rather than one prose sentence per change — with dozens of
 * relationship changes in a wide date range, a wall of "X → Y (type) went from A to B" sentences
 * reads as noise; scanning a From/Type/To/Status grid (same layout convention `EntityTable.tsx`
 * already uses) is far faster. Capped height + its own scroll so a long list doesn't push the
 * rest of the card off-screen — same "bordered, scrollable box" `AddEventModal.tsx`'s own
 * `CheckboxList` uses for the same reason. */
function RelationshipChangesTable({
  changes,
  entitiesById,
}: {
  changes: RelationshipChange[];
  entitiesById: Map<string, ResearchEntity>;
}) {
  return (
    <div
      className="overflow-y-auto"
      style={{ border: '1px solid var(--color-border-4)', borderRadius: 2, maxHeight: 240 }}
    >
      <div
        className="grid font-mono text-[9px] tracking-widest uppercase sticky top-0"
        style={{
          gridTemplateColumns: RELATIONSHIP_TABLE_COLUMNS,
          background: 'var(--color-surface-3)',
          color: 'var(--color-muted-3)',
        }}
      >
        <span className="px-2 py-1.5">From</span>
        <span className="px-2 py-1.5">Type</span>
        <span className="px-2 py-1.5">To</span>
        <span className="px-2 py-1.5">Status</span>
      </div>
      {changes.map((c, i) => {
        const fromName = entitiesById.get(c.fromEntityId)?.name ?? c.fromEntityId;
        const toName = entitiesById.get(c.toEntityId)?.name ?? c.toEntityId;
        return (
          <div
            key={c.relationshipId}
            className="grid items-center"
            style={{
              gridTemplateColumns: RELATIONSHIP_TABLE_COLUMNS,
              background: i % 2 === 0 ? 'var(--color-surface)' : '#0b0b0b',
            }}
          >
            <span className="font-mono text-[11px] px-2 py-1.5 text-foreground truncate">
              {fromName}
            </span>
            <span className="px-2 py-1.5 truncate">
              <Tag label={formatSlug(c.type)} color={colorForSlug(c.type)} />
            </span>
            <span className="font-mono text-[11px] px-2 py-1.5 text-foreground truncate">
              {toName}
            </span>
            <span className="font-mono text-[10px] px-2 py-1.5 text-muted truncate">
              {c.previousStatus === null
                ? `new: ${formatSlug(c.currentStatus)}`
                : `${formatSlug(c.previousStatus)} → ${formatSlug(c.currentStatus)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HypothesisChangeRow({ change }: { change: HypothesisChange }) {
  return (
    <p className="font-mono text-[11px] leading-relaxed text-muted">
      <span className="text-foreground">{change.name}</span>{' '}
      {change.previousConfidence === null ? (
        <>newly assessed at {formatPercent(change.currentConfidence)} confidence</>
      ) : (
        <>
          confidence {change.currentConfidence >= change.previousConfidence ? 'rose' : 'fell'} from{' '}
          {formatPercent(change.previousConfidence)} to {formatPercent(change.currentConfidence)}
        </>
      )}
    </p>
  );
}

function EvidenceRow({ evidence }: { evidence: Evidence }) {
  return (
    <p className="font-mono text-[11px] leading-relaxed text-muted">
      {evidence.description}{' '}
      <span className="text-muted-4">
        ({evidence.source.name}, {evidence.observedAt.slice(0, 10)})
      </span>
    </p>
  );
}

/** Same "bordered, capped-height, own scroll" treatment as `RelationshipChangesTable` — a wide
 * date range can turn up dozens of evidence records, and a page that just keeps growing to fit
 * all of them is exactly the "word soup" this is meant to avoid. */
function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  return (
    <div
      className="flex flex-col gap-1.5 overflow-y-auto"
      style={{
        border: '1px solid var(--color-border-4)',
        borderRadius: 2,
        padding: 8,
        maxHeight: 220,
      }}
    >
      {evidence.map((e) => (
        <EvidenceRow key={e.id} evidence={e} />
      ))}
    </div>
  );
}

function EventRow({
  event,
  entitiesById,
}: {
  event: ResearchEvent;
  entitiesById: Map<string, ResearchEntity>;
}) {
  const entityNames = event.entityIds.map((id) => entitiesById.get(id)?.name ?? id);
  return (
    <p className="font-mono text-[11px] leading-relaxed text-muted">
      <Tag label={formatSlug(event.type)} color={colorForSlug(event.type)} />
      {entityNames.length > 0 && (
        <span className="text-foreground"> {entityNames.join(', ')}</span>
      )}{' '}
      <span className="text-muted-4">({event.timestamp.slice(0, 10)})</span>
    </p>
  );
}

const GROUP_ROLE_LABEL = {
  'feeds-bot': 'can feed the model — only through the model effects below',
  context: 'context only — the model never reads this',
  'bot-view': 'what the model acts on',
} as const;

/** One collapsible subsection — the header's own "{label} (N)" count IS the succinct summary;
 * expanding it is the "parse through the full list" control. `defaultOpen` lets a caller start a
 * typically-short group (hypothesis reassessments, new events) open while a group that can get
 * long (relationship changes, evidence) starts collapsed, without hiding either behind different
 * UI — every group uses this same toggle. Renders nothing when `count` is 0, same as before.
 *
 * `role` says whether the group actually reaches the bot: `interpretResearchDelta` builds model
 * effects ONLY from relationship changes and hypothesis reassessments (`feeds-bot`); new evidence
 * and new events are shown for context but never read by the bot (`context`). */
function CollapsibleGroup({
  label,
  count,
  defaultOpen,
  role,
  children,
}: {
  label: string;
  count: number;
  defaultOpen: boolean;
  role: 'feeds-bot' | 'context' | 'bot-view';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 bg-transparent cursor-pointer self-start"
      >
        <span className="font-mono text-[9px] text-muted-4">{open ? '▾' : '▸'}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          {label} ({count})
        </span>
        <span
          className="font-mono text-[9px] tracking-wide"
          style={{ color: role === 'context' ? 'var(--color-muted-3)' : 'var(--color-accent-dim)' }}
        >
          · {GROUP_ROLE_LABEL[role]}
        </span>
      </button>
      {open && children}
    </div>
  );
}

/** A person-facing version of what `interpretResearchDelta` does for the bot every round: pick a
 * target entity and a date range, and see the SAME `RelationshipChange`/`HypothesisChange` diff
 * and the SAME typed, anti-inference-guarded `ModelEffect`s the bot would derive — lets you
 * sanity-check "does this research change actually mean what I think it means" against real data,
 * with no match/Docker run required. */
export default function ResearchDeltaTool({
  domain,
  entities,
}: {
  domain: string;
  entities: ResearchEntity[];
}) {
  const sortedEntities = [...entities].sort((a, b) => a.name.localeCompare(b.name));
  const [entityId, setEntityId] = useState<string | undefined>(sortedEntities[0]?.id);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { compute, result, loading, error } = useResearchDeltaTool(domain);

  const entitiesById = new Map(entities.map((e) => [e.id, e]));
  const entityName =
    (entityId !== undefined ? entitiesById.get(entityId)?.name : undefined) ?? 'this entity';
  const [cardExpanded, setCardExpanded] = useState(true);

  const handleCompute = () => {
    if (entityId === undefined) return;
    void compute(entityId, `${fromDate}T00:00:00Z`, `${toDate}T23:59:59Z`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Dropdown
          options={sortedEntities.map((e) => ({ value: e.id, label: e.name }))}
          selectedValue={entityId}
          onSelect={setEntityId}
        />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">From</span>
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
        <button
          onClick={handleCompute}
          disabled={loading || entityId === undefined}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {loading ? 'Computing…' : 'Compute'}
        </button>
      </div>

      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}

      {result !== undefined && (
        <div
          className="p-5 flex flex-col gap-4"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs leading-relaxed text-foreground">
              {summarizeDelta(result.delta, entityName, fromDate, toDate)}
            </p>
            {!result.delta.isEmpty && (
              <button
                onClick={() => {
                  setCardExpanded((e) => !e);
                }}
                className="font-mono text-[10px] text-muted-3 bg-transparent cursor-pointer shrink-0"
              >
                {cardExpanded ? '▾ Collapse' : '▸ Expand'}
              </button>
            )}
          </div>

          {cardExpanded && !result.delta.isEmpty && (
            <>
              <CollapsibleGroup
                label="Relationship Changes"
                role="feeds-bot"
                count={result.delta.changedRelationships.length}
                defaultOpen={false}
              >
                <RelationshipChangesTable
                  changes={result.delta.changedRelationships}
                  entitiesById={entitiesById}
                />
              </CollapsibleGroup>

              <CollapsibleGroup
                label="Hypothesis Reassessments"
                role="feeds-bot"
                count={result.delta.changedHypotheses.length}
                defaultOpen
              >
                <div className="flex flex-col gap-1">
                  {result.delta.changedHypotheses.map((c) => (
                    <HypothesisChangeRow key={c.hypothesisId} change={c} />
                  ))}
                </div>
              </CollapsibleGroup>

              <CollapsibleGroup
                label="New Evidence"
                role="context"
                count={result.delta.newEvidence.length}
                defaultOpen={false}
              >
                <EvidenceList evidence={result.delta.newEvidence} />
              </CollapsibleGroup>

              <CollapsibleGroup
                label="New Events"
                role="context"
                count={result.delta.newEvents.length}
                defaultOpen
              >
                <div className="flex flex-col gap-1">
                  {result.delta.newEvents.map((e) => (
                    <EventRow key={e.id} event={e} entitiesById={entitiesById} />
                  ))}
                </div>
              </CollapsibleGroup>

              <CollapsibleGroup
                label="Model Effects"
                role="bot-view"
                count={result.effects.length}
                defaultOpen
              >
                <p className="font-mono text-[10px] leading-relaxed text-muted-3">
                  In a simulation, each effect moves the model only on the trading day it first
                  appears — this view sums every change in the date range, the model never sees them
                  all at once.
                </p>
                <div className="flex flex-col gap-2">
                  {result.effects.map((effect, i) => (
                    <EffectCard key={`${effect.factor}-${String(i)}`} effect={effect} />
                  ))}
                </div>
              </CollapsibleGroup>
            </>
          )}
        </div>
      )}
    </div>
  );
}
