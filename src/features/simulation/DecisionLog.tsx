import type { RoundAuditEntry } from '@/hooks/apiTypes';
import { useDecisionLog } from './useDecisionLog';

interface OrderLike {
  ticker: string;
  side: string;
  quantity: number;
  kind?: string;
  limitPrice?: number;
}
interface FillLike {
  ticker: string;
  side: string;
  filledQuantity: number;
  requestedQuantity: number;
  priceCents: number;
}
interface DecisionLike {
  security?: string;
  action?: string;
  expectedReturn?: number;
  confidence?: number;
  targetWeight?: number;
  rationale?: string;
}

function ordersOf(entry: RoundAuditEntry): OrderLike[] {
  const orders = (entry.action as { orders?: unknown } | undefined)?.orders;
  return Array.isArray(orders) ? (orders as OrderLike[]) : [];
}

function fillsOf(entry: RoundAuditEntry): FillLike[] {
  return Array.isArray(entry.fills)
    ? (entry.fills as FillLike[]).filter((f) => f.filledQuantity > 0)
    : [];
}

const pct = (v: number | undefined) => (v === undefined ? '—' : `${(v * 100).toFixed(1)}%`);
const sideColor = (side: string) =>
  side === 'BUY' ? 'var(--color-accent)' : 'var(--color-danger)';

const selectStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
};

/** A forward match's decision audit trail for one bot, newest round first: what it submitted,
 * what filled (under realistic execution, a day's fills are the PREVIOUS day's orders filling at
 * this open), its equity after, the code it ran, and — click a row — its own rationale per
 * security. Rounds played before the audit trail existed simply don't appear. */
export default function DecisionLog() {
  const d = useDecisionLog();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            Simulation
          </span>
          <select
            value={d.match?.matchId}
            onChange={(e) => {
              d.selectMatch(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={selectStyle}
          >
            {d.matches.map((m) => (
              <option key={m.matchId} value={m.matchId}>
                {m.matchId} ({m.status})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">Model</span>
          <select
            value={d.participant}
            onChange={(e) => {
              d.selectParticipant(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={selectStyle}
          >
            {d.match?.participantIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {d.loading && <p className="font-mono text-xs text-muted-3">Loading…</p>}
      {d.error !== undefined && <p className="font-mono text-xs text-danger">{d.error}</p>}
      {!d.loading && d.error === undefined && d.entries.length === 0 && (
        <p className="font-mono text-xs text-muted-3">
          No audited trading days yet — trading days are recorded from now on, each time this
          simulation runs.
        </p>
      )}

      {d.entries.length > 0 && (
        <div className="border border-border-3 rounded-[2px] overflow-hidden">
          <div
            className="grid font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 bg-surface-3 text-muted-3 border-b border-border-3"
            style={{ gridTemplateColumns: '50px 90px 1fr 1fr 110px 90px' }}
          >
            <span>Trading Day</span>
            <span>Date</span>
            <span>Submitted</span>
            <span>Filled</span>
            <span className="text-right">Equity after</span>
            <span className="text-right">Code</span>
          </div>
          {d.entries.map((entry) => {
            const orders = ordersOf(entry);
            const fills = fillsOf(entry);
            const open = d.openRound === entry.roundIndex;
            return (
              <div key={entry.roundIndex} className="border-b border-border-3 last:border-b-0">
                <button
                  onClick={() => {
                    d.toggleRound(entry.roundIndex);
                  }}
                  className="grid w-full text-left font-mono text-[10px] px-3 py-2 bg-transparent cursor-pointer text-muted-2 hover:bg-surface-2"
                  style={{ gridTemplateColumns: '50px 90px 1fr 1fr 110px 90px' }}
                >
                  <span>{entry.roundIndex + 1}</span>
                  <span>{entry.date ?? '—'}</span>
                  <span>
                    {entry.collection !== 'ok' ? (
                      <span className="text-danger">{entry.collection}</span>
                    ) : orders.length === 0 ? (
                      <span className="text-muted-4">hold</span>
                    ) : (
                      orders.map((o, i) => (
                        <span key={i} className="block" style={{ color: sideColor(o.side) }}>
                          {o.side} {o.quantity.toLocaleString()} {o.ticker}
                          {o.kind === 'LIMIT' && o.limitPrice !== undefined
                            ? ` @ ${o.limitPrice.toFixed(2)}`
                            : ''}
                        </span>
                      ))
                    )}
                  </span>
                  <span>
                    {fills.length === 0 ? (
                      <span className="text-muted-4">—</span>
                    ) : (
                      fills.map((f, i) => (
                        <span key={i} className="block" style={{ color: sideColor(f.side) }}>
                          {f.side} {f.filledQuantity.toLocaleString()} {f.ticker} @ $
                          {(f.priceCents / 100).toFixed(2)}
                          {f.filledQuantity < f.requestedQuantity
                            ? ` (of ${f.requestedQuantity.toLocaleString()})`
                            : ''}
                        </span>
                      ))
                    )}
                  </span>
                  <span className="text-right">
                    {entry.equityCents === undefined
                      ? '—'
                      : (entry.equityCents / 100).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                  </span>
                  <span
                    className="text-right text-muted-4"
                    title={`source ${entry.sourceSha256 ?? '?'}\nconfig ${entry.configSha256 ?? '?'}`}
                  >
                    {entry.sourceSha256?.slice(0, 8) ?? '—'}
                  </span>
                </button>
                {open && <RationaleList rationale={entry.rationale} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RationaleList({ rationale }: { rationale: unknown[] | undefined }) {
  if (rationale === undefined || rationale.length === 0) {
    return (
      <p className="font-mono text-[10px] text-muted-4 px-3 pb-3">
        No rationale recorded for this trading day (the model doesn't emit any, or it was lost).
      </p>
    );
  }
  const decisions = (rationale as DecisionLike[])
    .slice()
    .sort((a, b) => Number(a.action === 'HOLD') - Number(b.action === 'HOLD'));
  return (
    <div className="flex flex-col gap-2 px-3 pb-3">
      {decisions.map((decision, i) => (
        <div
          key={i}
          className="font-mono text-[10px]"
          style={{ opacity: decision.action === 'HOLD' ? 0.6 : 1 }}
        >
          <span className="text-foreground">{decision.security ?? '?'}</span>{' '}
          <span
            style={{
              color:
                decision.action === 'HOLD'
                  ? 'var(--color-muted-3)'
                  : sideColor(decision.action ?? ''),
            }}
          >
            {decision.action ?? '?'}
          </span>
          <span className="text-muted-3">
            {' '}
            · exp. return {pct(decision.expectedReturn)} · confidence {pct(decision.confidence)} ·
            target weight {pct(decision.targetWeight)}
          </span>
          {decision.rationale !== undefined && (
            <p className="text-muted-2 mt-0.5">{decision.rationale}</p>
          )}
        </div>
      ))}
    </div>
  );
}
