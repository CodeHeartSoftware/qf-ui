import type { ReactNode } from 'react';

/** Shared by every research-panel form modal (news-sourced updates and the "from scratch"
 * add/edit/delete modals alike) — factored out of `ResearchUpdateModal.tsx`, which was the only
 * one of these until now, so a second modal didn't have to re-duplicate its plain-JS helpers and
 * input styling. */

export const inputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
  width: '100%',
};

/** `ResearchEvent.type` convention (`SUPPLIER_QUALIFIED`, not "Supplier qualified") — was
 * duplicated verbatim in both `AddEventModal` and `ResearchUpdateModal`'s own event section
 * before this was pulled out. */
export function normalizeEventType(rawType: string): string {
  return rawType.trim().toUpperCase().replace(/\s+/g, '_');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A short, stable suffix so two records minted the same day on the same base slug don't collide
 * on the same id — derived from real input text, never random, so re-rendering the same draft
 * without submitting yet produces the same id. */
export function shortHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36).slice(0, 6);
}

/** Every research-content id this feature mints, one named `build*Id` per collection — see
 * `frontend-conventions`'s own rule on why a derived id/key string never stays as an inline
 * template literal, even a single-use one. `buildEntityId` is the one formula shared by both a
 * news-sourced mint (`ResearchUpdateModal`) and a from-scratch one (`EntityFormModal`); the
 * others differ by which inputs are available in each modal, so stay separate rather than
 * forcing a shared signature neither caller actually has the inputs for. */
export function buildEntityId(name: string): string {
  return `entity-${slugify(name)}`;
}

export function buildEvidenceId(ticker: string, publishedDate: string, link: string): string {
  return `evidence-${slugify(ticker)}-${publishedDate}-${shortHash(link)}`;
}

export function buildNewsRelationshipId(primaryTicker: string, counterpartyName: string): string {
  return `rel-${slugify(primaryTicker)}-${slugify(counterpartyName)}`;
}

export function buildRelationshipId(
  fromEntityId: string,
  toEntityId: string,
  type: string,
): string {
  return `rel-${slugify(fromEntityId)}-${slugify(toEntityId)}-${slugify(type)}`;
}

export function buildNewsEventId(ticker: string, eventType: string, link: string): string {
  return `event-${slugify(ticker)}-${slugify(eventType)}-${shortHash(link)}`;
}

export function buildEventId(type: string, date: string, entityIds: readonly string[]): string {
  return `event-${slugify(type)}-${date}-${shortHash(entityIds.join(','))}`;
}

export function buildNewsHypothesisId(nameOrTicker: string, link: string): string {
  return `hypothesis-${slugify(nameOrTicker)}-${shortHash(link)}`;
}

export function buildHypothesisId(name: string, statement: string): string {
  return `hypothesis-${slugify(name)}-${shortHash(statement)}`;
}

/** An entity that now represents more than one formerly-separate company (e.g. after a
 * duplicate/merged entity gets consolidated — see `research-store`'s own delete-entity migrations)
 * gets a `"A/B"`-joined name, e.g. `"Sumitomo/A.L.M.T"`. Every rule in `findMatchingEntity` checks
 * a company name against each `/`-separated part individually (as well as the whole, unsplit
 * name) — still an exact/prefix comparison per part, never fuzzy, so "Sumitomo Electric" still
 * correctly resolves to that merged entity via part "Sumitomo" the same way it would have matched
 * a standalone "Sumitomo" entity before the merge. */
function nameVariants(name: string): string[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return [];
  const parts = trimmed
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 1 ? [trimmed, ...parts] : [trimmed];
}

/**
 * Resolves a company name to a research entity, trying progressively looser rules — never a
 * fuzzy/approximate match beyond these three explicit ones, since a wrong guess here would
 * misattribute research to the wrong entity:
 *   1. Exact name match (case/whitespace-insensitive) — against the entity's whole name, or any
 *      one of its `/`-joined parts if it's a merged entity (see `nameVariants`).
 *   2. One name is a leading-word prefix of the other, e.g. "Fujikura" vs "Fujikura Ltd." or
 *      "Sumitomo" vs "Sumitomo Electric" — handles a shortened/formal-suffix variant without
 *      maintaining a list of corporate suffixes (Inc./Ltd./Corp./...) to strip. Same per-part
 *      check as rule 1 for a merged entity.
 *   3. When `ticker` is given, the entity's own name (or a `/`-joined part of it) equals the
 *      ticker symbol itself, e.g. entity "AMSC" for ticker AMSC.
 *
 * The SAME three rules `apps/api`'s `quantAnalysis.ts` applies server-side (a
 * second implementation there — this is a browser bundle with no dependency on that Node package;
 * see `docs/adr/0015-quant-fusion-ui-read-api.md`). Change one, change both.
 */
export function findMatchingEntity<T extends { name: string }>(
  entities: T[],
  companyName: string,
  ticker?: string,
): T | undefined {
  const normalizedCompany = companyName.trim().toLowerCase();
  const byExactName = entities.find((e) =>
    nameVariants(e.name).some((variant) => variant.toLowerCase() === normalizedCompany),
  );
  if (byExactName !== undefined) return byExactName;

  const byNamePrefix = entities.find((e) =>
    nameVariants(e.name).some((variant) => {
      const normalizedEntity = variant.toLowerCase();
      if (normalizedEntity.length === 0) return false;
      return (
        normalizedCompany.startsWith(`${normalizedEntity} `) ||
        normalizedEntity.startsWith(`${normalizedCompany} `)
      );
    }),
  );
  if (byNamePrefix !== undefined) return byNamePrefix;

  if (ticker === undefined) return undefined;
  const normalizedTicker = ticker.trim().toLowerCase();
  return entities.find((e) =>
    nameVariants(e.name).some((variant) => variant.toLowerCase() === normalizedTicker),
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">{label}</span>
      {children}
    </label>
  );
}

export function SectionToggle({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 rounded-[2px] cursor-pointer"
      style={{
        background: enabled ? 'var(--color-accent-subtle-bg)' : 'transparent',
        border: `1px solid ${enabled ? 'var(--color-accent-subtle-border)' : 'var(--color-border-4)'}`,
      }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color: enabled ? 'var(--color-accent)' : 'var(--color-muted-2)' }}
      >
        {label}
      </span>
      <span className="font-mono text-[10px] text-muted-4">{enabled ? '− remove' : '+ add'}</span>
    </button>
  );
}
