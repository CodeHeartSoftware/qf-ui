import { useState } from 'react';
import { useApiAction } from '@/hooks/useApiAction';
import { useDatasetTickers } from '@/hooks/useDatasetTickers';
import type { MarketUniverse } from '@/hooks/apiTypes';

export type CreateMatchGameType = 'HISTORICAL' | 'FORWARD_SHADOW';

/** How the new match fills orders — see `apps/api`'s `emitForwardConfig.ts`.
 * `realistic` (next-day open plus spread/impact/volume cap) is the default; `legacy` (fill at the
 * same close the bot just saw, no costs) only exists to reproduce older matches' numbers. */
export type CreateMatchExecution = 'realistic' | 'legacy';

/** Sentinel `universeId` value meaning "build a new grouping from scratch" — the Market Universe
 * dropdown's own default option, never a real universe id. */
export const NEW_GROUPING = '__new_grouping__';

export interface CreateMatchResult {
  ok: boolean;
  exitCode: number | null;
  output: string;
  decisions?: unknown[];
  /** Only present for a successful FORWARD_SHADOW create — a HISTORICAL match runs to completion
   * in one shot with no persisted record to select afterward (see `apps/api`'s
   * `routes/matches.ts` doc comment). */
  matchId?: string;
}

export interface UseCreateMatchModalOptions {
  /** Every registered universe (built-in + custom) — populates the Market Universe dropdown and
   * is the source of "which dataset to add a symbol to" (see `handleAddUniverse`'s own doc
   * comment). */
  universes: MarketUniverse[];
  /** Called after a successful FORWARD_SHADOW creation so the caller (`MatchesPanel`) can select
   * the new match immediately — never called for a HISTORICAL create. */
  onForwardMatchCreated: (matchId: string) => void;
  /** Called after a successful custom-universe creation so the caller (`CreateMatchModal`) can
   * refetch `useMarketUniverses` — this hook only knows the list it was handed, not how to
   * refresh it. */
  onUniverseAdded: () => void;
}

interface AddUniverseResult {
  universe: MarketUniverse;
}

export interface AddNewTickerResult {
  ok: boolean;
  output: string;
  error?: string;
}

/** `CreateMatchModal.tsx`'s own state and handlers, pulled out per `frontend-conventions`'s
 * hookify default. Two real endpoints exist (`/api/matches/historical`, `/api/matches/forward`)
 * because they hand off to two genuinely different CLI commands (`match run` vs `match forward
 * run` — see that route file's own doc comment); `gameType` just picks which `useApiAction` is
 * "active" for submit/loading/result purposes, same pattern `RunMatchMenu.tsx` uses for its own
 * run-vs-preview actions. "Synthetic" is deliberately not an option here — out of scope for now. */
const TODAY = () => new Date().toISOString().slice(0, 10);
/** End of the current year — the same nominal target horizon a real, hand-created FORWARD_SHADOW
 * match in this app already uses (e.g. `fusion-quant-showdown`'s own config: created
 * 2026-09-15, `endDate: '2026-12-31'`, still only 58 rounds played). A forward match's `endDate`
 * is never a hard cutoff the way a HISTORICAL match's is — `effectiveTradingCalendar` (game.ts)
 * always caps actual play to whatever real, published data exists, however far out `endDate`
 * claims to reach — so defaulting it to "today" (as a HISTORICAL match reasonably does) would
 * create a forward match with zero room to ever run a next round. */
function defaultEndDateFor(gameType: CreateMatchGameType): string {
  if (gameType === 'HISTORICAL') return TODAY();
  return `${String(new Date().getFullYear())}-12-31`;
}

export function useCreateMatchModal({
  universes,
  onForwardMatchCreated,
  onUniverseAdded,
}: UseCreateMatchModalOptions) {
  const [gameType, setGameTypeState] = useState<CreateMatchGameType>('FORWARD_SHADOW');
  const [universeId, setUniverseIdState] = useState(NEW_GROUPING);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDateState] = useState(() => defaultEndDateFor('FORWARD_SHADOW'));
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [participantIds, setParticipantIds] = useState<Set<string>>(() => new Set());
  const [execution, setExecution] = useState<CreateMatchExecution>('realistic');

  const historicalAction = useApiAction<CreateMatchResult>('/api/matches/historical');
  const forwardAction = useApiAction<CreateMatchResult>('/api/matches/forward');
  const submit = gameType === 'HISTORICAL' ? historicalAction : forwardAction;

  // Market Universe / ticker-customization — always shown, not gated behind a toggle. Picking an
  // existing universe pre-checks its own tickers below (still freely toggleable, so a match's
  // symbol list never has to match one saved portfolio exactly); picking "+ New Grouping" (the
  // default) starts from an empty checklist. `universeId` alone is what a match submits with, so
  // a customized checklist only takes effect once saved via "+ Add Universe".
  const [newUniverseId, setNewUniverseId] = useState('');
  const [newUniverseLabel, setNewUniverseLabel] = useState('');
  const [newUniverseTickers, setNewUniverseTickers] = useState<Set<string>>(() => new Set());
  const addUniverseAction = useApiAction<AddUniverseResult>('/api/market-data/universes');

  // Only one real dataset exists to pull tickers from today (see `marketUniverses.ts`) — an
  // existing universe pins it directly; "+ New Grouping" falls back to the first registered one.
  const datasetSource =
    universeId === NEW_GROUPING ? universes[0] : universes.find((u) => u.id === universeId);
  const datasetTickers = useDatasetTickers(datasetSource?.datasetId, datasetSource?.datasetVersion);

  /** Selects the universe a match will submit with AND resets the ticker checklist to that
   * universe's own current tickers — still freely toggleable afterward (see this hook's own doc
   * comment above). */
  const setUniverseId = (id: string) => {
    setUniverseIdState(id);
    const picked = universes.find((u) => u.id === id);
    setNewUniverseId('');
    setNewUniverseLabel('');
    setNewUniverseTickers(new Set(picked?.tickers ?? []));
  };

  // "Add a new symbol" — any real, Yahoo-Finance-fetchable ticker can be added to the current
  // dataset (see `apps/api`'s `routes/marketData.ts` `POST /tickers` doc comment).
  const [newSymbolOpen, setNewSymbolOpen] = useState(false);
  const [newSymbolTicker, setNewSymbolTicker] = useState('');
  const [newSymbolYahooSymbol, setNewSymbolYahooSymbol] = useState('');
  const [newSymbolCurrency, setNewSymbolCurrency] = useState('USD');
  const [newSymbolUsdRate, setNewSymbolUsdRate] = useState('1');
  const addNewSymbolAction = useApiAction<AddNewTickerResult>('/api/market-data/tickers');

  const openNewSymbol = () => {
    setNewSymbolTicker('');
    setNewSymbolYahooSymbol('');
    setNewSymbolCurrency('USD');
    setNewSymbolUsdRate('1');
    setNewSymbolOpen(true);
  };
  const closeNewSymbol = () => {
    setNewSymbolOpen(false);
  };
  const canAddNewSymbol =
    newSymbolTicker.trim() !== '' &&
    datasetSource !== undefined &&
    Number.isFinite(Number(newSymbolUsdRate)) &&
    Number(newSymbolUsdRate) > 0;

  /** Fetches real bars for `newSymbolTicker` into the current dataset (see `addNewTicker.ts`'s
   * own doc comment on why this can be any symbol, not just fusion-related), then checks it for
   * the grouping being built and refreshes the live ticker list so it's checkable right away. */
  const handleAddNewSymbol = async () => {
    if (!canAddNewSymbol) return;
    const ticker = newSymbolTicker.trim().toUpperCase();
    const yahooSymbol = newSymbolYahooSymbol.trim();
    const currency = newSymbolCurrency.trim();
    const usdRate = newSymbolUsdRate.trim();
    const result = await addNewSymbolAction.run({
      datasetId: datasetSource.datasetId,
      datasetVersion: datasetSource.datasetVersion,
      ticker,
      ...(yahooSymbol !== '' ? { yahooSymbol } : {}),
      ...(currency !== '' ? { currency } : {}),
      ...(usdRate !== '' ? { usdRate: Number(usdRate) } : {}),
    });
    if (result?.ok === true) {
      datasetTickers.refetch();
      setNewUniverseTickers((prev) => new Set(prev).add(ticker));
      setNewSymbolOpen(false);
    }
  };

  const toggleNewUniverseTicker = (ticker: string) => {
    setNewUniverseTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };
  // The id/label fields and "+ Add Universe" only matter when building a NEW grouping: either
  // "+ New Grouping" itself, or an existing universe whose checklist was edited (an edit only takes
  // effect once saved as a new universe — `universeId` alone is what a match submits with).
  const selectedUniverse = universes.find((u) => u.id === universeId);
  const tickersEdited =
    selectedUniverse !== undefined &&
    (selectedUniverse.tickers.length !== newUniverseTickers.size ||
      selectedUniverse.tickers.some((ticker) => !newUniverseTickers.has(ticker)));
  const showNewUniverseFields = universeId === NEW_GROUPING || tickersEdited;

  const canAddUniverse =
    showNewUniverseFields &&
    newUniverseId.trim() !== '' &&
    newUniverseLabel.trim() !== '' &&
    datasetSource !== undefined &&
    newUniverseTickers.size > 0;

  /** The current dataset source's own `datasetId`/`datasetVersion` become the new universe's — a
   * person only picks a new id/label and a ticker selection built from that dataset's real,
   * currently-published tickers (see `CreateMatchModal.tsx`'s own doc comment for why this never
   * accepts a hand-typed dataset reference). On success, selects the new universe for the match
   * being created and tells the caller to refetch the full list. */
  const handleAddUniverse = async () => {
    if (!canAddUniverse) return;
    const result = await addUniverseAction.run({
      id: newUniverseId.trim(),
      label: newUniverseLabel.trim(),
      baseUniverseId: datasetSource.id,
      tickers: [...newUniverseTickers],
    });
    if (result !== undefined) {
      setUniverseIdState(result.universe.id);
      setNewUniverseId('');
      setNewUniverseLabel('');
      onUniverseAdded();
    }
  };

  // Re-defaults `endDate` when switching game type — but only while the person hasn't hand-edited
  // it yet, so picking a deliberate end date and THEN changing game type never gets clobbered.
  const setGameType = (next: CreateMatchGameType) => {
    setGameTypeState(next);
    if (!endDateTouched) setEndDateState(defaultEndDateFor(next));
  };
  const setEndDate = (value: string) => {
    setEndDateTouched(true);
    setEndDateState(value);
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = universeId !== NEW_GROUPING && participantIds.size > 0 && startDate < endDate;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await submit.run({
      participantIds: [...participantIds],
      universeId,
      startDate,
      endDate,
      execution,
    });
    if (result?.ok === true && gameType === 'FORWARD_SHADOW' && result.matchId !== undefined) {
      onForwardMatchCreated(result.matchId);
    }
  };

  return {
    gameType,
    setGameType,
    universeId,
    setUniverseId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    participantIds,
    toggleParticipant,
    execution,
    setExecution,
    canSubmit,
    handleSubmit,
    submit,
    newUniverseId,
    setNewUniverseId,
    newUniverseLabel,
    setNewUniverseLabel,
    newUniverseTickers,
    toggleNewUniverseTicker,
    showNewUniverseFields,
    canAddUniverse,
    handleAddUniverse,
    addUniverseAction,
    datasetTickers,
    newSymbolOpen,
    openNewSymbol,
    closeNewSymbol,
    newSymbolTicker,
    setNewSymbolTicker,
    newSymbolYahooSymbol,
    setNewSymbolYahooSymbol,
    newSymbolCurrency,
    setNewSymbolCurrency,
    newSymbolUsdRate,
    setNewSymbolUsdRate,
    canAddNewSymbol,
    handleAddNewSymbol,
    addNewSymbolAction,
  };
}
