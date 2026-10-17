import type { TradingDecision } from '@/hooks/apiTypes';

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${String(n)}th`;
  const suffix = ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${String(n)}${suffix}`;
}

/** One line answering "why is (or isn't) this name held?" — the bot sizes only the names its
 * selection rule picks, so an unselected name's 0% target weight otherwise has no visible reason.
 * `undefined` for decisions logged before the bot emitted `selection`. */
export function describeSelection(decision: TradingDecision): string | undefined {
  const s = decision.selection;
  if (s === undefined) return undefined;
  const ranked = `ranked ${ordinal(s.rank)} of ${String(s.rankedOf)} (score ${(s.score * 100).toFixed(2)}%)`;
  if (s.mode === 'top_k') {
    const rule = `top ${String(s.k ?? 0)} positive scores held`;
    if (s.selected) return `${ranked} — selected: ${rule}`;
    return s.score <= 0
      ? `${ranked} — not held: no positive view`
      : `${ranked} — not held: ${rule}`;
  }
  const bar = `${((s.threshold ?? 0) * 100).toFixed(2)}%`;
  return s.selected
    ? `${ranked} — selected: cleared the ${bar} bar`
    : `${ranked} — not held: below the ${bar} bar`;
}

/** Where fair value's static anchor came from — under `first_observed` it's the first close the
 * bot ever saw, which explains most "cheap"/"expensive" calls. */
export function describeAnchor(decision: TradingDecision): string | undefined {
  const a = decision.baseAnchor;
  if (a === undefined) return undefined;
  return a.mode === 'first_observed'
    ? `anchored to the first price seen, $${a.basePerShare.toFixed(4)}`
    : `anchored to the configured value, $${a.basePerShare.toFixed(4)}`;
}

/** Tag text for one ensemble weight. A 0% weight now means the factor measured as not predictive
 * (rank IC at or below zero) and is ignored — not that it's missing. */
export function ensembleWeightLabel(factor: string, weight: number): string {
  return weight === 0
    ? `${factor} 0% · ignored (IC ≤ 0)`
    : `${factor} ${(weight * 100).toFixed(0)}%`;
}
