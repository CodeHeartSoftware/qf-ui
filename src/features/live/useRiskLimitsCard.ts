import { useState } from 'react';
import { apiPatch } from '@/lib/api';
import type { LivePortfolio } from '@/hooks/apiTypes';

/** `RiskLimitsCard`'s draft (strings, so a field can be mid-edit) and save. An empty capital cap
 * means "no cap" (sent as `null`). */
export function useRiskLimitsCard(portfolio: LivePortfolio, onSaved: () => void) {
  const { risk } = portfolio;
  const [maxOrder, setMaxOrder] = useState(String(risk.maxOrderNotionalUsd));
  const [turnover, setTurnover] = useState(String(risk.maxDailyTurnoverPct));
  const [weight, setWeight] = useState(String(risk.maxPositionWeightPct));
  const [capital, setCapital] = useState(
    risk.maxCapitalUsd === undefined ? '' : String(risk.maxCapitalUsd),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await apiPatch(`/api/live/portfolios/${encodeURIComponent(portfolio.id)}`, {
        risk: {
          maxOrderNotionalUsd: Number(maxOrder),
          maxDailyTurnoverPct: Number(turnover),
          maxPositionWeightPct: Number(weight),
          maxCapitalUsd: capital.trim() === '' ? null : Number(capital),
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    maxOrder,
    setMaxOrder,
    turnover,
    setTurnover,
    weight,
    setWeight,
    capital,
    setCapital,
    saving,
    error,
    save,
  };
}
