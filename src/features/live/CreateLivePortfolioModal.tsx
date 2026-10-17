import Modal from '@/components/ui/Modal';
import type { LivePortfolio } from '@/hooks/apiTypes';
import { Field, inputStyle, SolidButton } from './liveUi';
import { useCreateLivePortfolioModal } from './useCreateLivePortfolioModal';

/** New live portfolio: which bot, which broker account, which universe. IBKR accounts must be
 * paper (`DU…`) unless the API was started with QUANT_FUSION_ALLOW_LIVE_TRADING=1. */
export default function CreateLivePortfolioModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (portfolio: LivePortfolio) => void;
}) {
  const f = useCreateLivePortfolioModal(onCreated);
  const select = { ...inputStyle } as const;

  return (
    <Modal open={open} onClose={onClose} title="New Live Portfolio">
      <Field label="Name">
        <input
          value={f.name}
          onChange={(e) => {
            f.setName(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={inputStyle}
        />
      </Field>
      <Field label="Model">
        <select
          value={f.botId}
          onChange={(e) => {
            f.setBotId(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={select}
        >
          {f.bots.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} (v{b.version})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Universe">
        <select
          value={f.universeId}
          onChange={(e) => {
            f.setUniverseId(e.target.value);
          }}
          className="font-mono text-xs text-foreground"
          style={select}
        >
          {f.universes.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label} ({u.tickers.length} tickers)
            </option>
          ))}
        </select>
      </Field>
      <Field label="Broker">
        <select
          value={f.broker}
          onChange={(e) => {
            f.setBroker(e.target.value as 'sim' | 'ibkr');
          }}
          className="font-mono text-xs text-foreground"
          style={select}
        >
          <option value="sim">Simulated (in-app paper account)</option>
          <option value="ibkr">Interactive Brokers (Client Portal Gateway)</option>
        </select>
      </Field>
      {f.broker === 'sim' ? (
        <Field label="Starting cash (USD)">
          <input
            type="number"
            value={f.simCash}
            onChange={(e) => {
              f.setSimCash(e.target.value);
            }}
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </Field>
      ) : (
        <>
          <Field label="IBKR paper account id">
            <input
              value={f.accountId}
              placeholder="DU1234567"
              onChange={(e) => {
                f.setAccountId(e.target.value);
              }}
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
          </Field>
          <Field label="Gateway URL (optional)">
            <input
              value={f.gatewayUrl}
              placeholder="https://localhost:5000"
              onChange={(e) => {
                f.setGatewayUrl(e.target.value);
              }}
              className="font-mono text-xs text-foreground"
              style={inputStyle}
            />
          </Field>
          <p className="font-mono text-[10px] text-muted-3">
            Run IBKR's Client Portal Gateway locally and log in with your paper credentials in a
            browser first. After creating, map each ticker to its IBKR contract.
          </p>
        </>
      )}
      {f.error !== undefined && <p className="font-mono text-[10px] text-danger">{f.error}</p>}
      <SolidButton
        className="self-end"
        disabled={
          f.saving || f.name.trim() === '' || (f.broker === 'ibkr' && f.accountId.trim() === '')
        }
        onClick={() => {
          void f.submit();
        }}
      >
        {f.saving ? 'Creating…' : 'Create'}
      </SolidButton>
    </Modal>
  );
}
