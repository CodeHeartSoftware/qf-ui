import TabButton from '@/components/ui/TabButton';
import LiveJobsIndicator from '@/features/jobs/LiveJobsIndicator';

export type Tab = 'fleet' | 'simulation' | 'live' | 'research' | 'jobs' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fleet', label: 'FLEET' },
  { id: 'live', label: 'LIVE' },
  { id: 'simulation', label: 'SIMULATION' },
  { id: 'research', label: 'RESEARCH' },
  { id: 'jobs', label: 'JOBS' },
  { id: 'settings', label: 'SETTINGS' },
];

export default function AppHeader({
  activeTab,
  onTabChange,
  matchesCount,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  matchesCount: number;
}) {
  return (
    <header className="border-b border-surface-2 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="font-mono text-sm font-bold text-accent"
            style={{ letterSpacing: '0.1em' }}
          >
            ⫸ QUANT FUSION
          </div>
          <div className="font-mono text-[10px] px-2 py-0.5 rounded-[1px] bg-accent-subtle-bg text-accent border border-accent-subtle-border">
            {matchesCount} FORWARD SIMULATION{matchesCount === 1 ? '' : 'S'}
          </div>
          <LiveJobsIndicator />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <TabButton
              key={t.id}
              label={t.label}
              active={activeTab === t.id}
              onClick={() => {
                onTabChange(t.id);
              }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
