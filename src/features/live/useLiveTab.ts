import { useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import type { LivePortfolio } from '@/hooks/apiTypes';

/** `LiveTab`'s state: every live portfolio, which one is selected, and the create modal. */
export function useLiveTab() {
  const { data, error, loading, refetch } = useApiResource<{
    portfolios: LivePortfolio[];
    liveTradingAllowed: boolean;
  }>('/api/live/portfolios');
  const portfolios = data?.portfolios ?? [];
  const [selectedId, setSelectedId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const selected = portfolios.find((p) => p.id === selectedId) ?? portfolios[0];

  return {
    portfolios,
    liveTradingAllowed: data?.liveTradingAllowed ?? false,
    error,
    loading,
    selected,
    setSelectedId,
    createOpen,
    openCreate: () => {
      setCreateOpen(true);
    },
    closeCreate: () => {
      setCreateOpen(false);
    },
    handleCreated: (portfolio: LivePortfolio) => {
      setCreateOpen(false);
      setSelectedId(portfolio.id);
      refetch();
    },
    handleChanged: refetch,
    handleDeleted: () => {
      setSelectedId(undefined);
      refetch();
    },
  };
}
