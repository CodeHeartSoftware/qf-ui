import type { ReactNode } from 'react';
import type { Evidence } from '@/hooks/apiTypes';

/** Resolves a list of evidence ids against the dataset's `evidenceById` map, dropping any that
 * don't resolve — the one step `EventTimeline`, `HypothesisCard`'s `AssessmentTimeline`, and
 * `RelationshipTable` all did identically before this was pulled out, each starting from a
 * different source list (an event's `evidenceIds`, an assessment's supporting+contradicting
 * ids, a relationship state's `evidenceIds`). */
export function resolveEvidence(
  ids: readonly string[],
  evidenceById: Map<string, Evidence>,
): Evidence[] {
  return ids.map((id) => evidenceById.get(id)).filter((e): e is Evidence => e !== undefined);
}

/**
 * The "here's the source backing this" line — shared by the same three places `resolveEvidence`
 * is. Prefers a cited record that actually has a URL to link to; not every piece of evidence does
 * (a company disclosure or a researcher's own note may have no captured URL — see `Evidence`'s
 * own doc comment), so this falls back to the source's plain name, never a fabricated link, plus
 * a "+N more" count when more than one record is cited.
 *
 * Renders nothing when `cited` is empty and no `emptyFallback` is given (matches
 * `EventTimeline`/`HypothesisCard`'s own convention of omitting the line entirely); pass
 * `emptyFallback` for a place that wants explicit "no source" text instead (matches
 * `RelationshipTable`'s convention).
 */
export default function EvidenceCitation({
  cited,
  className,
  emptyFallback,
}: {
  cited: Evidence[];
  className?: string;
  emptyFallback?: ReactNode;
}) {
  const linkable = cited.find((e) => e.source.uri !== undefined);
  const primary = linkable ?? cited[0];

  if (primary === undefined) {
    return emptyFallback === undefined ? null : <div className={className}>{emptyFallback}</div>;
  }

  return (
    <div className={className} title={primary.description}>
      {primary.source.uri !== undefined ? (
        <a
          href={primary.source.uri}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px]"
          style={{ color: 'var(--color-info)', textDecoration: 'underline' }}
        >
          {primary.source.name} ↗
        </a>
      ) : (
        <span className="font-mono text-[10px] text-muted-3">{primary.source.name}</span>
      )}
      {cited.length > 1 && (
        <span className="font-mono text-[9px] text-muted-4"> +{cited.length - 1} more</span>
      )}
    </div>
  );
}
