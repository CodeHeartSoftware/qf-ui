import MatchesPanel from '@/features/matches/MatchesPanel';
import PortfolioDashboard from '@/features/portfolio/PortfolioDashboard';
import DecisionLog from './DecisionLog';
import { SIMULATION_TABS, useSimulationPanel } from './useSimulationPanel';

/** Everything about simulated trading in one place — the match-centric leaderboard (Matches) and
 * the bot-centric drill-down (Bot Portfolios) — as sub-tabs, same style as `ResearchPanel`'s.
 * Real-account trading stays on its own Live tab on purpose. */
export default function SimulationPanel() {
  const { activeTab, setActiveTab } = useSimulationPanel();

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex gap-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--color-border-3)' }}
      >
        {SIMULATION_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
            }}
            className="font-mono text-[10px] px-4 py-2.5 shrink-0 transition-all bg-transparent cursor-pointer"
            style={{
              color: activeTab === t.id ? 'var(--color-foreground)' : 'var(--color-muted-3)',
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--color-accent)' : 'transparent'}`,
              letterSpacing: '0.07em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'matches' && <MatchesPanel />}
      {activeTab === 'portfolios' && <PortfolioDashboard />}
      {activeTab === 'decisions' && <DecisionLog />}
    </div>
  );
}
