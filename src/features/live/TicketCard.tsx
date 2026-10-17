import StatusPill, { type StatusTone } from '@/components/ui/StatusPill';
import type { LivePortfolio, OrderTicket, TicketStatus } from '@/hooks/apiTypes';
import { GhostButton, SolidButton, usd } from './liveUi';
import { useTicketCard } from './useTicketCard';

const STATUS: Record<TicketStatus, { label: string; tone: StatusTone }> = {
  pending_approval: { label: 'awaiting approval', tone: 'warning' },
  rejected: { label: 'rejected', tone: 'muted' },
  expired: { label: 'expired', tone: 'muted' },
  submitted: { label: 'submitted', tone: 'info' },
  completed: { label: 'completed', tone: 'accent' },
  failed: { label: 'failed', tone: 'danger' },
};

/** One bot decision for the account: every order the bot asked for, what the risk gate did to
 * it, and (once approved) what the broker did with it. */
export default function TicketCard({
  portfolio,
  ticket,
  onChanged,
}: {
  portfolio: LivePortfolio;
  ticket: OrderTicket;
  onChanged: () => void;
}) {
  const t = useTicketCard(portfolio, ticket, onChanged);
  const status = STATUS[ticket.status];

  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-3)',
        borderRadius: 2,
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={t.toggle} className="text-left bg-transparent cursor-pointer">
          <span className="font-mono text-xs text-foreground">
            {new Date(ticket.createdAt).toLocaleString()} · decided on {ticket.decisionDate} close
          </span>
          <span className="font-mono text-[10px] text-muted-3 block">
            {ticket.orders.length} order(s), {t.sendable.length} sendable · model equity{' '}
            {usd(ticket.botEquityUsd)}
          </span>
        </button>
        <StatusPill label={status.label} tone={status.tone} />
      </div>

      {t.expanded && (
        <>
          {ticket.orders.length === 0 ? (
            <p className="font-mono text-[10px] text-muted-4">The model wants no trades.</p>
          ) : (
            <table className="font-mono text-[10px] w-full">
              <thead className="text-muted-4 uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="text-left">Order</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Ref price</th>
                  <th className="text-right">Notional</th>
                  <th className="text-left pl-3">Risk gate / broker</th>
                </tr>
              </thead>
              <tbody>
                {ticket.orders.map((o) => (
                  <tr
                    key={o.clientOrderId}
                    className="align-top"
                    style={{ opacity: o.blocked ? 0.6 : 1 }}
                  >
                    <td
                      style={{
                        color: o.side === 'BUY' ? 'var(--color-accent)' : 'var(--color-danger)',
                      }}
                    >
                      {o.side} {o.ticker}{' '}
                      {o.orderType === 'LMT' && o.limitPriceUsd !== undefined
                        ? `@ ${o.limitPriceUsd.toFixed(2)}`
                        : ''}
                    </td>
                    <td className="text-right text-muted-2">
                      {o.quantity.toLocaleString()}
                      {o.quantity !== o.requestedQuantity && (
                        <span className="text-muted-4">
                          {' '}
                          / {o.requestedQuantity.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="text-right text-muted-2">${o.referencePriceUsd.toFixed(2)}</td>
                    <td className="text-right text-muted-2">{usd(o.notionalUsd)}</td>
                    <td className="pl-3">
                      {o.blocked ? (
                        <span className="text-danger">
                          BLOCKED:{' '}
                          {o.checks
                            .filter((c) => !c.ok)
                            .map((c) => c.message)
                            .join(' ')}
                        </span>
                      ) : (
                        <span className="text-muted-3">
                          {o.checks
                            .filter((c) => c.rule === 'lot_size' || c.rule === 'no_short')
                            .map((c) => c.message)
                            .join(' ') || 'passes'}
                        </span>
                      )}
                      {o.status !== undefined && (
                        <span className="block text-foreground">
                          {o.status.state}{' '}
                          {o.status.filledQuantity > 0
                            ? `· ${String(o.status.filledQuantity)} filled`
                            : ''}
                          {o.status.averageFillPrice !== undefined
                            ? ` @ ${o.status.averageFillPrice.toFixed(2)}`
                            : ''}
                          {o.status.messages.length > 0 && (
                            <span className="block text-muted-4">
                              {o.status.messages.join(' · ')}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {ticket.rationale.length > 0 && (
            <p className="font-mono text-[10px] text-muted-4">
              {ticket.rationale.length} decision rationale record(s) captured from the model.
            </p>
          )}
          {ticket.error !== undefined && (
            <p className="font-mono text-[10px] text-danger">{ticket.error}</p>
          )}
          {t.error !== undefined && <p className="font-mono text-[10px] text-danger">{t.error}</p>}

          {ticket.status === 'pending_approval' && (
            <div className="flex items-center gap-2 flex-wrap">
              {t.confirming ? (
                <>
                  <span className="font-mono text-[10px] text-warning">
                    Send {t.sendable.length} order(s) to{' '}
                    {portfolio.broker === 'sim'
                      ? 'the simulated account'
                      : `IBKR ${portfolio.accountId ?? ''}`}{' '}
                    as DAY orders?
                  </span>
                  <SolidButton tone="warning" disabled={t.busy} onClick={t.approve}>
                    Confirm & Send
                  </SolidButton>
                  <GhostButton onClick={t.cancelApprove}>Cancel</GhostButton>
                </>
              ) : (
                <>
                  <SolidButton disabled={t.busy || portfolio.killSwitch} onClick={t.askApprove}>
                    APPROVE
                  </SolidButton>
                  <GhostButton disabled={t.busy} onClick={t.reject}>
                    Reject
                  </GhostButton>
                </>
              )}
            </div>
          )}
          {ticket.status === 'submitted' && (
            <GhostButton className="self-start" disabled={t.busy} onClick={t.refresh}>
              Refresh order status
            </GhostButton>
          )}
        </>
      )}
    </div>
  );
}
