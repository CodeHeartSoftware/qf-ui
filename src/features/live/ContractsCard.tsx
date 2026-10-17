import type { LivePortfolio } from '@/hooks/apiTypes';
import { Card, GhostButton, inputStyle, SolidButton } from './liveUi';
import { useContractsCard } from './useContractsCard';

/** Maps each universe ticker to its IBKR contract (conid), currency, and lot size. Search hits
 * the IBKR gateway's own symbol lookup — for Tokyo listings search the numeric code (e.g. 5803),
 * and set lot size 100. An unmapped ticker can't be traded (its orders are blocked). */
export default function ContractsCard({
  portfolio,
  onSaved,
}: {
  portfolio: LivePortfolio;
  onSaved: () => void;
}) {
  const c = useContractsCard(portfolio, onSaved);
  const small = { ...inputStyle, padding: '3px 6px' };

  return (
    <Card
      title="IBKR Contracts"
      subtitle="Which IBKR instrument each ticker trades as. Tokyo (TSE) lots are 100 shares."
    >
      <table className="font-mono text-[10px] w-full">
        <thead className="text-muted-4 uppercase tracking-widest text-[9px]">
          <tr>
            <th className="text-left">Ticker</th>
            <th className="text-left">Conid</th>
            <th className="text-left">Exchange</th>
            <th className="text-left">Currency</th>
            <th className="text-left">Lot</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {c.tickers.map((ticker) => {
            const d = c.draft(ticker);
            return (
              <tr key={ticker}>
                <td className="text-foreground pr-2">{ticker}</td>
                <td className="pr-2">
                  <input
                    value={d.conid}
                    onChange={(e) => {
                      c.update(ticker, { conid: e.target.value });
                    }}
                    className="font-mono text-[10px] text-foreground"
                    style={small}
                  />
                </td>
                <td className="pr-2">
                  <input
                    value={d.exchange}
                    onChange={(e) => {
                      c.update(ticker, { exchange: e.target.value });
                    }}
                    className="font-mono text-[10px] text-foreground"
                    style={small}
                  />
                </td>
                <td className="pr-2">
                  <input
                    value={d.currency}
                    onChange={(e) => {
                      c.update(ticker, { currency: e.target.value });
                    }}
                    className="font-mono text-[10px] text-foreground"
                    style={{ ...small, width: 60 }}
                  />
                </td>
                <td className="pr-2">
                  <input
                    type="number"
                    value={d.lotSize}
                    onChange={(e) => {
                      c.update(ticker, { lotSize: e.target.value });
                    }}
                    className="font-mono text-[10px] text-foreground"
                    style={{ ...small, width: 60 }}
                  />
                </td>
                <td>
                  <GhostButton
                    onClick={() => {
                      c.openSearch(ticker);
                    }}
                  >
                    Search
                  </GhostButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {c.searchTicker !== undefined && (
        <div
          className="flex flex-col gap-2 p-3"
          style={{ border: '1px solid var(--color-border-4)', borderRadius: 2 }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-3">
              IBKR symbol for {c.searchTicker}:
            </span>
            <input
              value={c.searchSymbol}
              onChange={(e) => {
                c.setSearchSymbol(e.target.value);
              }}
              className="font-mono text-[10px] text-foreground"
              style={{ ...small, width: 120 }}
            />
            <SolidButton
              disabled={c.searching}
              onClick={() => {
                void c.search();
              }}
            >
              {c.searching ? '…' : 'Search'}
            </SolidButton>
            <GhostButton onClick={c.closeSearch}>Close</GhostButton>
          </div>
          {c.candidates.map((candidate) => (
            <button
              key={candidate.conid}
              onClick={() => {
                c.pick(candidate);
              }}
              className="text-left font-mono text-[10px] text-muted-2 bg-transparent cursor-pointer hover:text-foreground"
            >
              {candidate.conid} · {candidate.symbol} · {candidate.description}{' '}
              {candidate.exchange !== undefined ? `· ${candidate.exchange}` : ''}
            </button>
          ))}
        </div>
      )}

      {c.error !== undefined && <p className="font-mono text-[10px] text-danger">{c.error}</p>}
      <SolidButton
        className="self-start"
        disabled={c.saving}
        onClick={() => {
          void c.save();
        }}
      >
        {c.saving ? 'Saving…' : 'Save Contracts'}
      </SolidButton>
    </Card>
  );
}
