import { useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';
import { useMarketUniverses } from '@/hooks/useMarketUniverses';
import type { ContractCandidate, ContractMapping, LivePortfolio } from '@/hooks/apiTypes';

export interface ContractDraft {
  conid: string;
  currency: string;
  lotSize: string;
  exchange: string;
}

function draftFor(mapping: ContractMapping | undefined): ContractDraft {
  return {
    conid: mapping === undefined ? '' : String(mapping.conid),
    currency: mapping?.currency ?? 'USD',
    lotSize: String(mapping?.lotSize ?? 1),
    exchange: mapping?.exchange ?? '',
  };
}

/** `ContractsCard`'s per-ticker drafts, IBKR contract search, and save. Tickers left without a
 * conid are simply unmapped (the risk gate blocks any order for them). */
export function useContractsCard(portfolio: LivePortfolio, onSaved: () => void) {
  const { universes } = useMarketUniverses();
  const tickers = universes.find((u) => u.id === portfolio.universeId)?.tickers ?? [];
  const [drafts, setDrafts] = useState<Record<string, ContractDraft>>(() =>
    Object.fromEntries(portfolio.contracts.map((c) => [c.ticker, draftFor(c)])),
  );
  const [searchTicker, setSearchTicker] = useState<string>();
  const [searchSymbol, setSearchSymbol] = useState('');
  const [candidates, setCandidates] = useState<ContractCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const draft = (ticker: string) => drafts[ticker] ?? draftFor(undefined);
  const update = (ticker: string, patch: Partial<ContractDraft>) => {
    setDrafts((d) => ({ ...d, [ticker]: { ...(d[ticker] ?? draftFor(undefined)), ...patch } }));
  };

  const search = async () => {
    setSearching(true);
    setError(undefined);
    try {
      const { candidates: found } = await apiGet<{ candidates: ContractCandidate[] }>(
        `/api/live/portfolios/${encodeURIComponent(portfolio.id)}/contracts/search?symbol=${encodeURIComponent(searchSymbol)}`,
      );
      setCandidates(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const contracts = Object.entries(drafts)
        .filter(([, d]) => d.conid.trim() !== '')
        .map(([ticker, d]) => ({
          ticker,
          conid: Number(d.conid),
          currency: d.currency.trim().toUpperCase(),
          lotSize: Number(d.lotSize),
          ...(d.exchange.trim() !== '' ? { exchange: d.exchange.trim() } : {}),
        }));
      await apiPatch(`/api/live/portfolios/${encodeURIComponent(portfolio.id)}`, { contracts });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return {
    tickers,
    draft,
    update,
    searchTicker,
    openSearch: (ticker: string) => {
      setSearchTicker(ticker);
      setSearchSymbol(ticker);
      setCandidates([]);
    },
    closeSearch: () => {
      setSearchTicker(undefined);
    },
    searchSymbol,
    setSearchSymbol,
    candidates,
    searching,
    search,
    pick: (candidate: ContractCandidate) => {
      if (searchTicker === undefined) return;
      update(searchTicker, { conid: String(candidate.conid), exchange: candidate.exchange ?? '' });
      setSearchTicker(undefined);
    },
    saving,
    error,
    save,
  };
}
