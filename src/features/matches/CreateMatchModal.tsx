import ActionLog from '@/components/ui/ActionLog';
import CheckboxList from '@/components/ui/CheckboxList';
import DecisionExplainer from '@/components/ui/DecisionExplainer';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { useBots } from '@/hooks/useBots';
import { useMarketUniverses } from '@/hooks/useMarketUniverses';
import {
  NEW_GROUPING,
  useCreateMatchModal,
  type CreateMatchExecution,
  type CreateMatchGameType,
} from './useCreateMatchModal';

const dateInputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
};

const EXECUTION_OPTIONS: { value: CreateMatchExecution; label: string }[] = [
  { value: 'realistic', label: 'Realistic — next-day open + trading costs' },
  { value: 'legacy', label: 'Legacy — same-day close, no costs' },
];

const GAME_TYPE_OPTIONS: { value: CreateMatchGameType; label: string }[] = [
  { value: 'FORWARD_SHADOW', label: 'Forward-Facing' },
  { value: 'HISTORICAL', label: 'Historical' },
];

/** Creates a brand-new `stock-market-4` match — either FORWARD_SHADOW (persisted, resumable
 * round by round via `RunMatchMenu`, same as every match already in the switcher) or HISTORICAL
 * (`match run`, plays the whole window in one shot and is NEVER persisted — this app has no store
 * for historical results today, so its outcome only ever exists as this modal's own log; see
 * `apps/api`'s `routes/matches.ts` doc comment). "Synthetic" is deliberately not
 * offered — out of scope for now.
 *
 * The Market Universe dropdown's first option is always "+ New Grouping" (the default) — picking
 * it, or any real universe, reveals the same always-on ticker checklist below: an existing
 * universe pre-checks its own current tickers (still freely toggleable, so a match's symbol list
 * never has to match one saved portfolio exactly — see `useCreateMatchModal.ts`'s own doc
 * comment), while "+ New Grouping" starts empty. The id/label fields and "+ Add Universe" only show
 * for "+ New Grouping" or once an existing universe's checklist is edited (see
 * `useCreateMatchModal.ts`'s `showNewUniverseFields`). "+ Add Universe" persists whatever's checked
 * (`POST /api/market-data/universes`) under a new id/label, inheriting the current dataset's
 * identity so it can never point at nonexistent/unfetched data (see `apps/api`'s
 * `customUniverses.ts` doc comment) — that saved universe is what a match actually submits with.
 * "+ Add New Symbol" fetches real Yahoo Finance bars for a brand-new ticker (not necessarily
 * fusion-related — see `addNewTicker.ts`'s own doc comment) straight into that dataset, then
 * checks it so it's immediately usable.
 *
 * State/handlers live in `useCreateMatchModal` — this component only renders. */
export default function CreateMatchModal({
  open,
  onClose,
  onForwardMatchCreated,
}: {
  open: boolean;
  onClose: () => void;
  onForwardMatchCreated: (matchId: string) => void;
}) {
  const { bots } = useBots();
  const { universes, refetch: refetchUniverses } = useMarketUniverses();
  const participantOptions = bots.filter((b) => b.game === 'stock-market-4');
  const universeOptions = [
    { value: NEW_GROUPING, label: '+ New Grouping' },
    ...universes.map((u) => ({ value: u.id, label: u.label })),
  ];

  const {
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
  } = useCreateMatchModal({
    universes,
    onForwardMatchCreated,
    onUniverseAdded: refetchUniverses,
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Simulation">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Game Type
        </span>
        <Dropdown options={GAME_TYPE_OPTIONS} selectedValue={gameType} onSelect={setGameType} />
        {gameType === 'HISTORICAL' && (
          <p className="font-mono text-[10px] text-muted-4">
            Plays the whole date range in one run — not saved to the simulation switcher; results
            show below once it finishes.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Market Universe
        </span>
        <Dropdown options={universeOptions} selectedValue={universeId} onSelect={setUniverseId} />
        <div
          className="flex flex-col gap-2 p-3"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-3)',
            borderRadius: 2,
          }}
        >
          {showNewUniverseFields && (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newUniverseId}
                onChange={(e) => {
                  setNewUniverseId(e.target.value);
                }}
                placeholder="id (e.g. tungsten-only)"
                className="font-mono text-xs text-foreground"
                style={dateInputStyle}
              />
              <input
                value={newUniverseLabel}
                onChange={(e) => {
                  setNewUniverseLabel(e.target.value);
                }}
                placeholder="Label (e.g. Tungsten Only)"
                className="font-mono text-xs text-foreground"
                style={dateInputStyle}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
                Tickers ({newUniverseTickers.size} selected)
              </span>
              {!newSymbolOpen && (
                <button
                  onClick={openNewSymbol}
                  className="font-mono text-[9px] uppercase tracking-widest text-muted-3 bg-transparent cursor-pointer"
                >
                  + Add New Symbol
                </button>
              )}
            </div>
            {newSymbolOpen && (
              <div
                className="flex flex-col gap-2 p-2"
                style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border-4)',
                  borderRadius: 2,
                }}
              >
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={newSymbolTicker}
                    onChange={(e) => {
                      setNewSymbolTicker(e.target.value);
                    }}
                    placeholder="Ticker (e.g. NVDA)"
                    className="font-mono text-xs text-foreground col-span-3"
                    style={dateInputStyle}
                  />
                  <input
                    value={newSymbolYahooSymbol}
                    onChange={(e) => {
                      setNewSymbolYahooSymbol(e.target.value);
                    }}
                    placeholder="Yahoo symbol (optional)"
                    className="font-mono text-xs text-foreground"
                    style={dateInputStyle}
                  />
                  <input
                    value={newSymbolCurrency}
                    onChange={(e) => {
                      setNewSymbolCurrency(e.target.value);
                    }}
                    placeholder="Currency"
                    className="font-mono text-xs text-foreground"
                    style={dateInputStyle}
                  />
                  <input
                    value={newSymbolUsdRate}
                    onChange={(e) => {
                      setNewSymbolUsdRate(e.target.value);
                    }}
                    placeholder="USD rate"
                    className="font-mono text-xs text-foreground"
                    style={dateInputStyle}
                  />
                </div>
                {addNewSymbolAction.error !== undefined && (
                  <p className="font-mono text-[10px] text-danger">{addNewSymbolAction.error}</p>
                )}
                {addNewSymbolAction.result?.ok === false && (
                  <p className="font-mono text-[10px] text-danger">
                    {addNewSymbolAction.result.error ?? 'Failed to add symbol.'}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={closeNewSymbol}
                    disabled={addNewSymbolAction.loading}
                    className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      void handleAddNewSymbol();
                    }}
                    disabled={addNewSymbolAction.loading || !canAddNewSymbol}
                    className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                      color: 'var(--color-background)',
                    }}
                  >
                    {addNewSymbolAction.loading ? 'Fetching…' : '+ Fetch & Add'}
                  </button>
                </div>
              </div>
            )}
            <CheckboxList
              items={datasetTickers.tickers.map((ticker) => ({ id: ticker }))}
              selectedIds={newUniverseTickers}
              labelFor={(t) => t.id}
              onToggle={toggleNewUniverseTicker}
              maxHeightClassName="max-h-32"
              emptyMessage="No tickers available for this dataset."
            />
          </div>
          {showNewUniverseFields && addUniverseAction.error !== undefined && (
            <p className="font-mono text-[10px] text-danger">{addUniverseAction.error}</p>
          )}
          {showNewUniverseFields && (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  void handleAddUniverse();
                }}
                disabled={addUniverseAction.loading || !canAddUniverse}
                className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-background)',
                }}
              >
                {addUniverseAction.loading ? 'Adding…' : '+ Add Universe'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            Start Date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={dateInputStyle}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
            {gameType === 'HISTORICAL' ? 'End Date' : 'Target Horizon'}
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={dateInputStyle}
          />
        </div>
      </div>
      {gameType === 'FORWARD_SHADOW' && (
        <p className="font-mono text-[10px] text-muted-4">
          Not a hard cutoff — a forward simulation only ever plays as far as real, published data
          actually reaches, however far out this is. Defaults to end of year, same as this app's
          existing forward simulations.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">Fills</span>
        <Dropdown options={EXECUTION_OPTIONS} selectedValue={execution} onSelect={setExecution} />
        <p className="font-mono text-[10px] text-muted-4">
          {execution === 'realistic'
            ? 'Orders fill at the next trading day’s open, paying a 15 bps half-spread plus market impact, capped at 5% of average daily volume.'
            : 'Orders fill at the same close the model just saw, at no cost — optimistic by roughly 20–30 points on 2026 data. Use only to reproduce older matches.'}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Participants ({participantIds.size} selected)
        </span>
        <CheckboxList
          items={participantOptions}
          selectedIds={participantIds}
          labelFor={(bot) => `${bot.name} (${bot.id})`}
          onToggle={toggleParticipant}
          maxHeightClassName="max-h-40"
          emptyMessage="No models found."
        />
      </div>

      {submit.error !== undefined && (
        <p className="font-mono text-[10px] text-danger">{submit.error}</p>
      )}
      {submit.result !== undefined && (
        <div className="flex flex-col gap-2">
          <p
            className="font-mono text-[10px]"
            style={{ color: submit.result.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}
          >
            {submit.result.ok
              ? submit.result.matchId !== undefined
                ? `Created and selected simulation "${submit.result.matchId}".`
                : 'Simulation completed.'
              : 'The simulation could not be created — see output below.'}
          </p>
          <DecisionExplainer decisions={submit.result.decisions ?? []} />
          <ActionLog output={submit.result.output} ok={submit.result.ok} />
        </div>
      )}

      <div
        className="flex items-center justify-end gap-2 pt-2"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <button
          onClick={onClose}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          Close
        </button>
        <button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submit.loading || !canSubmit}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {submit.loading ? 'Creating…' : '+ Create Simulation'}
        </button>
      </div>
    </Modal>
  );
}
