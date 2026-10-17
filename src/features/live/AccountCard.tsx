import type { BrokerAccountSnapshot } from '@/hooks/apiTypes';
import { Card, usd } from './liveUi';

/** The broker's own view of the account — cash, net liquidation, and every position, including
 * holdings outside this portfolio's mapped universe (marked "unmanaged": never shown to the bot). */
export default function AccountCard({
  snapshot,
  error,
  connected,
}: {
  snapshot: BrokerAccountSnapshot | undefined;
  error: string | undefined;
  connected: boolean;
}) {
  return (
    <Card
      title="Account"
      subtitle={
        snapshot !== undefined
          ? `${snapshot.accountId} · as of ${new Date(snapshot.asOf).toLocaleString()}`
          : undefined
      }
    >
      {!connected && <p className="font-mono text-[10px] text-muted-4">Not connected.</p>}
      {error !== undefined && <p className="font-mono text-[10px] text-danger">{error}</p>}
      {snapshot !== undefined && (
        <>
          <div className="flex gap-6 font-mono text-xs">
            <span className="text-muted-3">
              Cash <span className="text-foreground">{usd(snapshot.cashUsd)}</span>
            </span>
            <span className="text-muted-3">
              Net liq <span className="text-foreground">{usd(snapshot.netLiquidationUsd)}</span>
            </span>
          </div>
          {snapshot.positions.length === 0 ? (
            <p className="font-mono text-[10px] text-muted-4">No positions.</p>
          ) : (
            <table className="font-mono text-[10px] w-full">
              <thead className="text-muted-4 uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="text-left">Position</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Avg cost</th>
                </tr>
              </thead>
              <tbody className="text-muted-2">
                {snapshot.positions.map((p) => (
                  <tr key={`${p.ticker ?? p.description}-${String(p.conid ?? '')}`}>
                    <td>
                      {p.ticker ?? p.description}
                      {p.ticker === undefined && <span className="text-muted-4"> (unmanaged)</span>}
                    </td>
                    <td className="text-right">{p.shares.toLocaleString()}</td>
                    <td className="text-right">
                      {p.averageCost.toFixed(2)} {p.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Card>
  );
}
