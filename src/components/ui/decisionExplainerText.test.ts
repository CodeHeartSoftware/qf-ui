import { describe, expect, it } from 'vitest';
import type { TradingDecision } from '@/hooks/apiTypes';
import { describeAnchor, describeSelection, ensembleWeightLabel } from './decisionExplainerText';

function decision(overrides: Partial<TradingDecision>): TradingDecision {
  return {
    date: '2026-07-01',
    security: 'ALM',
    action: 'HOLD',
    expectedReturn: 0,
    confidence: 0,
    ensembleWeights: {},
    desiredWeight: 0,
    targetWeight: 0,
    riskAdjustments: [],
    valuationAfter: 1,
    researchChanges: [],
    modelEffects: [],
    falsifiers: [],
    rationale: '',
    ...overrides,
  };
}

const topK = (rank: number, score: number, selected: boolean) =>
  decision({ selection: { mode: 'top_k', score, rank, rankedOf: 11, selected, k: 4 } });

describe('describeSelection', () => {
  it('explains a held name', () => {
    expect(describeSelection(topK(2, 0.0123, true))).toBe(
      'ranked 2nd of 11 (score 1.23%) — selected: top 4 positive scores held',
    );
  });

  it('explains an unheld name outside the top k', () => {
    expect(describeSelection(topK(6, 0.004, false))).toBe(
      'ranked 6th of 11 (score 0.40%) — not held: top 4 positive scores held',
    );
  });

  it('says "no positive view" when the score is not positive, whatever the rank', () => {
    expect(describeSelection(topK(3, -0.01, false))).toContain('not held: no positive view');
  });

  it('describes the threshold rule', () => {
    const d = decision({
      selection: {
        mode: 'threshold',
        score: 0.005,
        rank: 11,
        rankedOf: 11,
        selected: false,
        threshold: 0.01,
      },
    });
    expect(describeSelection(d)).toBe(
      'ranked 11th of 11 (score 0.50%) — not held: below the 1.00% bar',
    );
  });

  it('is undefined for older decisions without the field', () => {
    expect(describeSelection(decision({}))).toBeUndefined();
  });
});

describe('describeAnchor', () => {
  it('names the first-observed anchor', () => {
    expect(
      describeAnchor(decision({ baseAnchor: { mode: 'first_observed', basePerShare: 12.5 } })),
    ).toBe('anchored to the first price seen, $12.5000');
  });

  it('is undefined for older decisions', () => {
    expect(describeAnchor(decision({}))).toBeUndefined();
  });
});

describe('ensembleWeightLabel', () => {
  it('marks a zero weight as ignored', () => {
    expect(ensembleWeightLabel('momentum', 0)).toBe('momentum 0% · ignored (IC ≤ 0)');
    expect(ensembleWeightLabel('valuation_gap', 0.361)).toBe('valuation_gap 36%');
  });
});
