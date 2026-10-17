import { useState } from 'react';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { useApiResource } from '@/hooks/useApiResource';
import type {
  BrokerAccountSnapshot,
  BrokerConnectionStatus,
  LivePortfolio,
  OrderTicket,
} from '@/hooks/apiTypes';

/** `LivePortfolioPanel`'s state: broker connection, account snapshot, tickets, and the actions
 * (propose, kill switch, delete). */
export function useLivePortfolioPanel(
  portfolio: LivePortfolio,
  onChanged: () => void,
  onDeleted: () => void,
) {
  const base = `/api/live/portfolios/${encodeURIComponent(portfolio.id)}`;
  const status = useApiResource<BrokerConnectionStatus>(`${base}/broker-status`);
  const snapshot = useApiResource<{ snapshot: BrokerAccountSnapshot }>(
    status.data?.authenticated === true ? `${base}/snapshot` : null,
  );
  const tickets = useApiResource<{ tickets: OrderTicket[] }>(`${base}/tickets`);
  const [proposing, setProposing] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(undefined);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    status: status.data,
    statusLoading: status.loading,
    refreshStatus: status.refetch,
    snapshot: snapshot.data?.snapshot,
    snapshotError: snapshot.error,
    tickets: tickets.data?.tickets ?? [],
    proposing,
    actionError,
    propose: () => {
      setProposing(true);
      void run(() => apiPost(`${base}/propose`)).finally(() => {
        setProposing(false);
        tickets.refetch();
      });
    },
    toggleKillSwitch: () => {
      void run(() => apiPatch(base, { killSwitch: !portfolio.killSwitch })).then(onChanged);
    },
    handleTicketChanged: () => {
      tickets.refetch();
      snapshot.refetch();
    },
    confirmingDelete,
    askDelete: () => {
      setConfirmingDelete(true);
    },
    cancelDelete: () => {
      setConfirmingDelete(false);
    },
    confirmDelete: () => {
      void run(() => apiDelete(base)).then(onDeleted);
    },
  };
}
