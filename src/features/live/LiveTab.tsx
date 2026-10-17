import PageHeader from '@/components/ui/PageHeader';
import CreateLivePortfolioModal from './CreateLivePortfolioModal';
import LivePortfolioPanel from './LivePortfolioPanel';
import { SolidButton } from './liveUi';
import { useLiveTab } from './useLiveTab';

/** Real accounts managed by a bot — deliberately its own tab, apart from simulated matches: a
 * different data source (the broker, not a dataset), a different lifecycle (proposals a person
 * approves, not rounds that auto-resolve), and real consequences. Nothing reaches a broker
 * without an explicit Approve on a ticket. State/handlers live in `useLiveTab`. */
export default function LiveTab() {
  const {
    portfolios,
    liveTradingAllowed,
    error,
    loading,
    selected,
    setSelectedId,
    createOpen,
    openCreate,
    closeCreate,
    handleCreated,
    handleChanged,
    handleDeleted,
  } = useLiveTab();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title="Live Portfolios"
          subtitle="A model proposes orders for a real (paper) account; you approve each ticket before anything is sent."
        />
        <div className="flex items-end gap-3">
          {portfolios.length > 0 && (
            <select
              value={selected?.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
              }}
              className="font-mono text-xs text-foreground"
              style={{
                colorScheme: 'dark',
                background: 'transparent',
                border: '1px solid var(--color-border-4)',
                borderRadius: 2,
                padding: '6px 8px',
              }}
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.broker === 'sim' ? 'SIM' : p.accountId}
                </option>
              ))}
            </select>
          )}
          <SolidButton onClick={openCreate}>+ NEW PORTFOLIO</SolidButton>
        </div>
      </div>

      {liveTradingAllowed && (
        <p className="font-mono text-[10px] text-danger">
          QUANT_FUSION_ALLOW_LIVE_TRADING is set — real-money (non-paper) IBKR accounts are enabled.
        </p>
      )}
      {loading && <p className="font-mono text-xs text-muted-3">Loading…</p>}
      {error !== undefined && <p className="font-mono text-xs text-danger">{error}</p>}
      {!loading && error === undefined && portfolios.length === 0 && (
        <p className="font-mono text-xs text-muted-3">
          No live portfolios yet. Start with a SIM portfolio to try the workflow, then connect an
          IBKR paper account.
        </p>
      )}
      {selected !== undefined && (
        <LivePortfolioPanel
          key={selected.id}
          portfolio={selected}
          onChanged={handleChanged}
          onDeleted={handleDeleted}
        />
      )}

      <CreateLivePortfolioModal open={createOpen} onClose={closeCreate} onCreated={handleCreated} />
    </div>
  );
}
