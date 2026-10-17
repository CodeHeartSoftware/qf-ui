import { useState } from 'react';
import type { TradingDecision } from '@/hooks/apiTypes';
import { describeAnchor, describeSelection } from './decisionExplainerText';

/** State and derived text for one `DecisionExplainer` card: the details toggle, whether there's
 * anything behind it, and the "why held / why not" and valuation-anchor lines. */
export function useDecisionCard(decision: TradingDecision) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    Object.keys(decision.ensembleWeights).length > 0 ||
    decision.riskAdjustments.length > 0 ||
    decision.modelEffects.length > 0 ||
    decision.falsifiers.length > 0 ||
    decision.rationale.trim().length > 0;
  return {
    expanded,
    toggleExpanded: () => {
      setExpanded((e) => !e);
    },
    hasDetails,
    selectionLine: describeSelection(decision),
    anchorLine: describeAnchor(decision),
  };
}
