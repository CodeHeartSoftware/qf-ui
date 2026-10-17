import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import { colorForSlug, formatSlug } from '@/utils/format';
import type { Evidence, HypothesisAssessment, ResearchHypothesis } from '@/hooks/apiTypes';
import DeleteItemButton from './DeleteItemButton';
import EvidenceCitation, { resolveEvidence } from './EvidenceCitation';
import HypothesisFormModal from './HypothesisFormModal';

const STATUS_COLORS: Record<string, string> = {
  proposed: 'var(--color-muted)',
  active: 'var(--color-info)',
  supported: 'var(--color-accent)',
  weakened: 'var(--color-warning)',
  falsified: 'var(--color-danger)',
  accepted: 'var(--color-accent)',
  rejected: 'var(--color-danger)',
  retired: 'var(--color-muted-3)',
};

function confidenceColor(value: number): string {
  return value >= 0.6
    ? 'var(--color-accent)'
    : value >= 0.35
      ? 'var(--color-warning)'
      : 'var(--color-danger)';
}

/** The confidence/status history below the fold — every assessment, oldest first (reads as a
 * narrative of how this belief evolved), not just the latest reading `h.assessments` accumulates
 * (see research-core's own doc comment on why it's an append-only list rather than a single
 * mutable value). Mirrors `EventTimeline`'s dot+spine convention for visual consistency with the
 * rest of this tab. */
function AssessmentTimeline({
  assessments,
  evidenceById,
}: {
  assessments: HypothesisAssessment[];
  evidenceById: Map<string, Evidence>;
}) {
  const sorted = [...assessments].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return (
    <div className="flex flex-col">
      {sorted.map((a, i) => {
        const previous = sorted[i - 1];
        const deltaPoints =
          previous !== undefined
            ? Math.round((a.confidence.value - previous.confidence.value) * 100)
            : undefined;
        const color = confidenceColor(a.confidence.value);
        const cited = resolveEvidence(
          [...a.supportingEvidenceIds, ...a.contradictingEvidenceIds],
          evidenceById,
        );

        return (
          <div key={a.timestamp} className="flex gap-4 relative">
            <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  marginTop: 14,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${color}66`,
                }}
              />
              {i < sorted.length - 1 && (
                <div
                  style={{ width: 1, flex: 1, background: 'var(--color-border-3)', minHeight: 20 }}
                />
              )}
            </div>
            <div className="pb-6 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] text-muted-2">
                  {a.timestamp.slice(0, 10)}
                </span>
                <span className="font-mono text-xs font-bold" style={{ color }}>
                  {(a.confidence.value * 100).toFixed(0)}%
                </span>
                {deltaPoints !== undefined && deltaPoints !== 0 && (
                  <span
                    className="font-mono text-[10px]"
                    style={{
                      color: deltaPoints > 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                    }}
                  >
                    {deltaPoints > 0 ? '▲' : '▼'}
                    {Math.abs(deltaPoints)}pt
                  </span>
                )}
                {a.status !== undefined && (
                  <Tag
                    label={`→ ${formatSlug(a.status)}`}
                    color={STATUS_COLORS[a.status] ?? colorForSlug(a.status)}
                  />
                )}
              </div>
              {a.rationale !== undefined && (
                <p className="font-mono text-[11px] leading-relaxed text-muted">{a.rationale}</p>
              )}
              <EvidenceCitation cited={cited} className="mt-1.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** `ResearchHypothesis.assessments` accumulates one confidence (and, optionally, status) reading
 * per timestamp rather than holding a single mutable value (see `research-core`'s own doc
 * comment) — the collapsed header shows the MOST RECENT reading, but expanding the card shows
 * every one of them via `AssessmentTimeline`, not just the latest. */
export default function HypothesisCard({
  h,
  evidenceById,
  domain,
  onChanged,
}: {
  h: ResearchHypothesis;
  evidenceById: Map<string, Evidence>;
  domain: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const latest = [...h.assessments].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const confidence = latest?.confidence.value ?? 0;
  const confColor = confidenceColor(confidence);
  const statusColor = STATUS_COLORS[h.status] ?? 'var(--color-muted)';

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <button
        className="w-full text-left p-4 flex items-start gap-4"
        onClick={() => {
          setOpen((o) => !o);
        }}
        style={{ background: 'transparent' }}
      >
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <span className="font-mono text-lg font-bold" style={{ color: confColor, lineHeight: 1 }}>
            {(confidence * 100).toFixed(0)}
          </span>
          <span className="font-mono text-[8px] text-muted-3">CONF%</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Tag label={h.status.toUpperCase()} color={statusColor} />
            {latest !== undefined && (
              <span className="font-mono text-[10px] text-muted-3">
                {h.assessments.length} assessment{h.assessments.length === 1 ? '' : 's'} · last{' '}
                {latest.timestamp.slice(0, 10)}
              </span>
            )}
          </div>
          <p className="font-mono text-sm font-semibold text-foreground">{h.name}</p>
          <p className="font-mono text-xs leading-relaxed mt-1 text-muted">{h.statement}</p>
        </div>
        <span className="font-mono text-xs shrink-0 text-muted-4">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--color-surface-2)' }}>
          {h.assessments.length > 0 && (
            <div className="mt-3">
              <p className="font-mono text-[9px] tracking-widest uppercase mb-2 text-muted-3">
                Confidence &amp; Status Over Time
              </p>
              <AssessmentTimeline assessments={h.assessments} evidenceById={evidenceById} />
            </div>
          )}
          {(h.falsifiers?.length ?? 0) > 0 && (
            <div className={h.assessments.length > 0 ? 'mt-1' : 'mt-3'}>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-2 text-muted-3">
                Falsifiers
              </p>
              <ul className="flex flex-col gap-1.5">
                {(h.falsifiers ?? []).map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-4 shrink-0">·</span>
                    <span className="font-mono text-[11px] leading-relaxed text-muted">
                      {f.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div
            className="flex items-center gap-3 mt-4 pt-3"
            style={{ borderTop: '1px solid var(--color-surface-2)' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="font-mono text-[10px] bg-transparent cursor-pointer text-muted-3"
            >
              edit
            </button>
            <DeleteItemButton
              domain={domain}
              collection="hypotheses"
              id={h.id}
              onDeleted={onChanged}
            />
          </div>
        </div>
      )}
      <HypothesisFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
        }}
        domain={domain}
        hypothesis={h}
        onSuccess={() => {
          setEditOpen(false);
          onChanged();
        }}
      />
    </div>
  );
}
