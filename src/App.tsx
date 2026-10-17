import { useState } from 'react';
import AppHeader, { type Tab } from '@/components/layout/AppHeader';
import PageHeader from '@/components/ui/PageHeader';
import FleetTab from '@/features/fleet/FleetTab';
import JobsPanel from '@/features/jobs/JobsPanel';
import LiveTab from '@/features/live/LiveTab';
import ResearchPanel from '@/features/research/ResearchPanel';
import SettingsPanel from '@/features/settings/SettingsPanel';
import SimulationPanel from '@/features/simulation/SimulationPanel';
import { useForwardMatches } from '@/hooks/useForwardMatches';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fleet');
  const { matches } = useForwardMatches();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={matches.filter((m) => m.status === 'active').length}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'fleet' && <FleetTab />}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <PageHeader
                title="Simulation"
                subtitle="Models trading against real market data in forward and historical simulations — no real money."
              />
            </div>
            <SimulationPanel />
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-fade-in">
            <LiveTab />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <PageHeader
                title="Batch Jobs"
                subtitle="Market-data and research freshness across every active forward simulation."
              />
            </div>
            <JobsPanel />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <PageHeader
                title="Market Research"
                subtitle="The real fusion research dataset — entities, relationships, hypotheses, and events."
              />
            </div>
            <ResearchPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <PageHeader
                title="Settings"
                subtitle="Quant Fusion-wide configuration — API keys and other shared config."
              />
            </div>
            <SettingsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
