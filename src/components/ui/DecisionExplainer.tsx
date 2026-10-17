import Tag from '@/components/ui/Tag';
import { colorForSlug } from '@/utils/format';
import type { TradingDecision } from '@/hooks/apiTypes';
import { ensembleWeightLabel } from './decisionExplainerText';
import { useDecisionCard } from './useDecisionCard';

/** Defensive narrowing of the loosely-typed `decisions: unknown[]` a run/preview action returns —
 * parsed from a bot's own `QUANT_DECISION_JSON:` log line (see `apps/api`'s
 * `parseQuantDecisions`), so a malformed or future-shaped object degrades to "not rendered" rather
 * than a crash. Only checks the fields this component actually reads. */
function isTradingDecision(value: unknown): value is TradingDecision {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.security === 'string' &&
    typeof v.action === 'string' &&
    typeof v.expectedReturn === 'number' &&
    typeof v.confidence === 'number' &&
    typeof v.desiredWeight === 'number' &&
    typeof v.targetWeight === 'number' &&
    typeof v.valuationAfter === 'number' &&
    typeof v.rationale === 'string'
  );
}

/** A preview calls the bot TWICE per ticker (once "at stored config", once "right now" — see
 * `matchForwardPreview.ts`), so `decisions` can hold two entries for the same security with no
 * tag distinguishing them. Keeps the LAST one per security — the "right now" call always runs
 * second, so this is the one that actually reflects the live preview, not a stale duplicate sitting
 * next to it. A no-op for `run`'s own single-pass decisions (nothing to dedupe there). */
function dedupeBySecurity(decisions: TradingDecision[]): TradingDecision[] {
  const bySecurity = new Map<string, TradingDecision>();
  for (const decision of decisions) {
    bySecurity.set(decision.security, decision);
  }
  return [...bySecurity.values()];
}

/** `--color-muted`'s value — `Tag` appends a hex alpha suffix to its color, so a CSS variable
 * can't be passed through. */
const IGNORED_FACTOR_COLOR = '#666666';

function actionColor(action: TradingDecision['action']): string {
  if (action === 'BUY') return 'var(--color-accent)';
  if (action === 'SELL') return 'var(--color-danger)';
  return 'var(--color-muted-3)';
}

function DecisionCard({ decision }: { decision: TradingDecision }) {
  const { expanded, toggleExpanded, hasDetails, selectionLine, anchorLine } =
    useDecisionCard(decision);

  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-foreground">{decision.security}</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest font-bold"
            style={{ color: actionColor(decision.action) }}
          >
            {decision.action}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-4">
          exp. return {(decision.expectedReturn * 100).toFixed(1)}% · confidence{' '}
          {(decision.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <span className="font-mono text-[10px] text-muted-3">
        target weight {(decision.desiredWeight * 100).toFixed(1)}% →{' '}
        {(decision.targetWeight * 100).toFixed(1)}%
      </span>

      {selectionLine !== undefined && (
        <span className="font-mono text-[10px] text-muted-4">{selectionLine}</span>
      )}

      {hasDetails && (
        <button
          onClick={toggleExpanded}
          className="self-start font-mono text-[9px] uppercase tracking-widest text-muted-4 bg-transparent cursor-pointer"
        >
          {expanded ? '▲ hide details' : '▼ show details'}
        </button>
      )}

      {expanded && (
        <>
          <span className="font-mono text-[10px] text-muted-3">
            fair value {decision.valuationBefore?.toFixed(4) ?? '(none)'} →{' '}
            {decision.valuationAfter.toFixed(4)}
            {anchorLine !== undefined && <span className="text-muted-4"> · {anchorLine}</span>}
          </span>

          {Object.keys(decision.ensembleWeights).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(decision.ensembleWeights).map(([factor, weight]) => (
                <Tag
                  key={factor}
                  label={ensembleWeightLabel(factor, weight)}
                  color={weight === 0 ? IGNORED_FACTOR_COLOR : colorForSlug(factor)}
                />
              ))}
            </div>
          )}

          {decision.riskAdjustments.length > 0 && (
            <p className="font-mono text-[10px] text-muted-4">
              risk: {decision.riskAdjustments.join(' | ')}
            </p>
          )}

          {decision.modelEffects.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                Model Effects
              </span>
              {decision.modelEffects.map((effect, i) => (
                <p key={`effect-${String(i)}`} className="font-mono text-[10px] text-muted">
                  {effect}
                </p>
              ))}
            </div>
          )}

          {decision.falsifiers.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                Falsifiers
              </span>
              {decision.falsifiers.map((f, i) => (
                <p key={`falsifier-${String(i)}`} className="font-mono text-[10px] text-muted">
                  {f}
                </p>
              ))}
            </div>
          )}

          {decision.rationale.trim().length > 0 && (
            <p className="font-mono text-[11px] leading-relaxed text-muted-2">
              {decision.rationale}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Renders every `TradingDecision` a quant-sdk-js-based bot emitted during a run/preview — the
 * SAME structured object `decision.ts` built (ensemble weights, risk adjustments, model effects,
 * falsifiers, rationale), rather than the 6-line human trace `ActionLog`'s raw text alone would
 * show. Each card opens COMPACT (ticker/action/expected-return/confidence/target-weight, plus the
 * one-line "ranked Nth of M — selected / not held" reason, since under top-k selection an unheld
 * name's 0% would otherwise be unexplained) —
 * the rest (fair value, ensemble weights, risk adjustments, model effects, falsifiers, the full
 * rationale paragraph) sits behind a per-card "show details" toggle, since a match with a dozen
 * tracked securities previously rendered a full wall of prose for every one of them regardless of
 * whether anything interesting happened. Renders nothing (not an empty state) when `decisions` is
 * empty — most bots don't emit this yet, and `ActionLog`'s raw text right below this already
 * covers that case. */
export default function DecisionExplainer({ decisions }: { decisions: unknown[] }) {
  const parsed = dedupeBySecurity(decisions.filter(isTradingDecision));
  if (parsed.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
        Signals ({parsed.length})
      </span>
      {parsed.map((decision, i) => (
        <DecisionCard key={`${decision.security}-${String(i)}`} decision={decision} />
      ))}
    </div>
  );
}
