import StatusPill from '@/components/ui/StatusPill';
import type { LivePortfolio } from '@/hooks/apiTypes';
import AccountCard from './AccountCard';
import ContractsCard from './ContractsCard';
import RiskLimitsCard from './RiskLimitsCard';
import TicketCard from './TicketCard';
import { Card, GhostButton, SolidButton } from './liveUi';
import { useLivePortfolioPanel } from './useLivePortfolioPanel';

/** One live portfolio: connection, account, limits, contract mapping (IBKR), and its tickets.
 * "Propose orders" only reads the account and asks the bot — nothing is sent until a ticket is
 * approved. */
export default function LivePortfolioPanel({
  portfolio,
  onChanged,
  onDeleted,
}: {
  portfolio: LivePortfolio;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const p = useLivePortfolioPanel(portfolio, onChanged, onDeleted);
  const connected = p.status?.authenticated === true;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={portfolio.name}
        subtitle={`${portfolio.botId} · ${portfolio.broker === 'sim' ? 'simulated account' : `IBKR ${portfolio.accountId ?? ''}`} · universe ${portfolio.universeId}`}
        right={
          <StatusPill
            label={p.statusLoading ? 'checking…' : connected ? 'connected' : 'disconnected'}
            tone={p.statusLoading ? 'muted' : connected ? 'accent' : 'danger'}
          />
        }
      >
        {p.status?.message !== undefined && (
          <p className="font-mono text-[10px] text-warning">{p.status.message}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <SolidButton
            disabled={!connected || p.proposing || portfolio.killSwitch}
            onClick={p.propose}
          >
            {p.proposing ? 'ASKING MODEL…' : 'PROPOSE ORDERS'}
          </SolidButton>
          <SolidButton
            tone={portfolio.killSwitch ? 'accent' : 'danger'}
            onClick={p.toggleKillSwitch}
          >
            {portfolio.killSwitch ? 'RELEASE KILL SWITCH' : 'KILL SWITCH'}
          </SolidButton>
          <GhostButton onClick={p.refreshStatus}>Reconnect</GhostButton>
          {p.confirmingDelete ? (
            <>
              <span className="font-mono text-[10px] text-danger">
                Delete portfolio and its tickets? (The broker account is untouched.)
              </span>
              <SolidButton tone="danger" onClick={p.confirmDelete}>
                Delete
              </SolidButton>
              <GhostButton onClick={p.cancelDelete}>Cancel</GhostButton>
            </>
          ) : (
            <GhostButton onClick={p.askDelete}>Delete…</GhostButton>
          )}
        </div>
        {portfolio.killSwitch && (
          <p className="font-mono text-[10px] text-danger">
            Kill switch is ON — every order is blocked and no ticket can be approved.
          </p>
        )}
        {p.actionError !== undefined && (
          <p className="font-mono text-[10px] text-danger whitespace-pre-wrap">{p.actionError}</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <AccountCard snapshot={p.snapshot} error={p.snapshotError} connected={connected} />
        <RiskLimitsCard portfolio={portfolio} onSaved={onChanged} />
      </div>

      {portfolio.broker === 'ibkr' && <ContractsCard portfolio={portfolio} onSaved={onChanged} />}

      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-sm font-bold text-foreground">Tickets</h3>
        {p.tickets.length === 0 && (
          <p className="font-mono text-[10px] text-muted-4">No tickets yet.</p>
        )}
        {p.tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            portfolio={portfolio}
            ticket={ticket}
            onChanged={p.handleTicketChanged}
          />
        ))}
      </div>
    </div>
  );
}
