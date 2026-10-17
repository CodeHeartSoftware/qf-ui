import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { LivePortfolio, OrderTicket } from '@/hooks/apiTypes';

/** `TicketCard`'s actions — approve needs an explicit second click (it sends real orders). */
export function useTicketCard(
  portfolio: LivePortfolio,
  ticket: OrderTicket,
  onChanged: () => void,
) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [expanded, setExpanded] = useState(ticket.status === 'pending_approval');

  const act = (action: 'approve' | 'reject' | 'refresh') => {
    setBusy(true);
    setError(undefined);
    setConfirming(false);
    apiPost(
      `/api/live/portfolios/${encodeURIComponent(portfolio.id)}/tickets/${encodeURIComponent(ticket.id)}/${action}`,
    )
      .then(onChanged)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return {
    expanded,
    toggle: () => {
      setExpanded((e) => !e);
    },
    sendable: ticket.orders.filter((o) => !o.blocked),
    confirming,
    askApprove: () => {
      setConfirming(true);
    },
    cancelApprove: () => {
      setConfirming(false);
    },
    approve: () => {
      act('approve');
    },
    reject: () => {
      act('reject');
    },
    refresh: () => {
      act('refresh');
    },
    busy,
    error,
  };
}
