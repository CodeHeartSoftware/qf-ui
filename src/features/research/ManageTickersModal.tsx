import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { apiDelete, apiPost } from '@/lib/api';

interface MutationResult {
  ok: boolean;
  error?: string;
}

const inputStyle = {
  colorScheme: 'dark' as const,
  background: 'transparent',
  border: '1px solid var(--color-border-4)',
  borderRadius: 2,
  padding: '6px 8px',
  width: '100%',
};

/** Adds/removes tickers from a research domain's own news watchlist (`@quant-fusion/research-store`'s
 * `tracked_tickers`, via `/api/research/:domain/tickers`) — this is the "which companies' news do I
 * want to read" list, decoupled from (and lighter-weight than) the actual tradeable/price-fetched
 * market-data universe: adding a ticker here does not make it tradeable in a match, it only makes
 * its company's news show up in this domain's News Feed tab. */
export default function ManageTickersModal({
  open,
  onClose,
  domain,
  tickers,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
  tickers: { ticker: string; companyName: string }[];
  /** Called after a successful add/remove so the caller (`NewsFeedSection`) refetches the news
   * feed — a newly tracked ticker's articles show up immediately, and a removed one's disappear. */
  onChanged: () => void;
}) {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [busyTicker, setBusyTicker] = useState<string>();
  const [error, setError] = useState<string>();

  const handleAdd = async () => {
    setError(undefined);
    setBusyTicker(ticker.trim());
    try {
      const result = await apiPost<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/tickers`,
        { ticker: ticker.trim(), companyName: companyName.trim() },
      );
      if (!result.ok) {
        setError(result.error ?? 'The ticker could not be added.');
        return;
      }
      setTicker('');
      setCompanyName('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyTicker(undefined);
    }
  };

  const handleRemove = async (target: string) => {
    setError(undefined);
    setBusyTicker(target);
    try {
      const result = await apiDelete<MutationResult>(
        `/api/research/${encodeURIComponent(domain)}/tickers/${encodeURIComponent(target)}`,
      );
      if (!result.ok) {
        setError(result.error ?? 'The ticker could not be removed.');
        return;
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyTicker(undefined);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Tracked Tickers">
      <p className="font-mono text-[10px] leading-relaxed text-muted-3">
        Which companies&apos; news this domain&apos;s News Feed tab fetches — separate from (and
        lighter than) the actual tradeable market-data universe.
      </p>

      {tickers.length === 0 ? (
        <p className="font-mono text-xs text-muted-4">No tickers tracked yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tickers.map((t) => (
            <div
              key={t.ticker}
              className="flex items-center justify-between px-3 py-2 rounded-[2px]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-3)',
              }}
            >
              <div>
                <span className="font-mono text-xs font-semibold text-foreground">{t.ticker}</span>
                <span className="font-mono text-[10px] ml-2 text-muted-3">{t.companyName}</span>
              </div>
              <button
                onClick={() => {
                  void handleRemove(t.ticker);
                }}
                disabled={busyTicker !== undefined}
                className="font-mono text-[10px] text-danger bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyTicker === t.ticker ? '…' : '✕ remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex flex-col gap-2 pt-3"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-4">
          Add a ticker
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase());
            }}
            placeholder="Ticker (e.g. NVDA)"
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
          <input
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
            }}
            placeholder="Company name (e.g. NVIDIA)"
            className="font-mono text-xs text-foreground"
            style={inputStyle}
          />
        </div>
        {error !== undefined && <p className="font-mono text-[10px] text-danger">{error}</p>}
        <button
          onClick={() => {
            void handleAdd();
          }}
          disabled={busyTicker !== undefined || ticker.trim() === '' || companyName.trim() === ''}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] font-bold border cursor-pointer self-start disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
        >
          {busyTicker === ticker.trim() ? 'Adding…' : '+ Add Ticker'}
        </button>
      </div>

      <div
        className="flex items-center justify-end pt-2"
        style={{ borderTop: '1px solid var(--color-surface-2)' }}
      >
        <button
          onClick={onClose}
          className="font-mono text-[10px] px-3 py-1.5 rounded-[1px] border border-border-4 bg-transparent text-muted cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
