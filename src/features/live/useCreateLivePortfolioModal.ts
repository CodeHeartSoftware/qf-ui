import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { useBots } from '@/hooks/useBots';
import { useMarketUniverses } from '@/hooks/useMarketUniverses';
import type { BrokerKind, LivePortfolio } from '@/hooks/apiTypes';

/** `CreateLivePortfolioModal`'s form state and submit. */
export function useCreateLivePortfolioModal(onCreated: (portfolio: LivePortfolio) => void) {
  const { bots } = useBots();
  const { universes } = useMarketUniverses();
  const [name, setName] = useState('');
  const [botId, setBotId] = useState('');
  const [broker, setBroker] = useState<BrokerKind>('sim');
  const [accountId, setAccountId] = useState('');
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [universeId, setUniverseId] = useState('');
  const [simCash, setSimCash] = useState('100000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const effectiveBotId = botId || (bots[0]?.id ?? '');
  const effectiveUniverseId = universeId || (universes[0]?.id ?? '');

  const submit = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const { portfolio } = await apiPost<{ portfolio: LivePortfolio }>('/api/live/portfolios', {
        name,
        botId: effectiveBotId,
        broker,
        universeId: effectiveUniverseId,
        ...(broker === 'ibkr'
          ? { accountId, ...(gatewayUrl.trim() !== '' ? { gatewayUrl } : {}) }
          : { simStartingCashUsd: Number(simCash) }),
      });
      onCreated(portfolio);
      setName('');
      setAccountId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    bots,
    universes,
    name,
    setName,
    botId: effectiveBotId,
    setBotId,
    broker,
    setBroker,
    accountId,
    setAccountId,
    gatewayUrl,
    setGatewayUrl,
    universeId: effectiveUniverseId,
    setUniverseId,
    simCash,
    setSimCash,
    saving,
    error,
    submit,
  };
}
