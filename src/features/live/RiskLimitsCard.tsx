import type { LivePortfolio } from '@/hooks/apiTypes';
import { Card, Field, inputStyle, SolidButton } from './liveUi';
import { useRiskLimitsCard } from './useRiskLimitsCard';

/** Limits every proposed order is checked against (see the API's `lib/live/riskGate.ts`). A
 * failing order stays on the ticket, marked blocked, and is never sent. */
export default function RiskLimitsCard({
  portfolio,
  onSaved,
}: {
  portfolio: LivePortfolio;
  onSaved: () => void;
}) {
  const r = useRiskLimitsCard(portfolio, onSaved);
  const input = (value: string, set: (v: string) => void, placeholder?: string) => (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        set(e.target.value);
      }}
      className="font-mono text-xs text-foreground"
      style={inputStyle}
    />
  );
  return (
    <Card title="Risk Limits" subtitle="Applied to every proposal; blocked orders are never sent.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Max order (USD)">{input(r.maxOrder, r.setMaxOrder)}</Field>
        <Field label="Max turnover / ticket (%)">{input(r.turnover, r.setTurnover)}</Field>
        <Field label="Max position weight (%)">{input(r.weight, r.setWeight)}</Field>
        <Field label="Capital the model manages (USD)">
          {input(r.capital, r.setCapital, 'whole account')}
        </Field>
      </div>
      {r.error !== undefined && <p className="font-mono text-[10px] text-danger">{r.error}</p>}
      <SolidButton
        className="self-start"
        disabled={r.saving}
        onClick={() => {
          void r.save();
        }}
      >
        {r.saving ? 'Saving…' : 'Save Limits'}
      </SolidButton>
    </Card>
  );
}
