import { useState } from 'react';

export type SimulationTab = 'matches' | 'portfolios' | 'decisions';

export const SIMULATION_TABS: { id: SimulationTab; label: string }[] = [
  { id: 'matches', label: 'SIMULATIONS' },
  { id: 'portfolios', label: 'MODEL PORTFOLIOS' },
  { id: 'decisions', label: 'DECISION LOG' },
];

/** `SimulationPanel`'s active sub-tab. */
export function useSimulationPanel() {
  const [activeTab, setActiveTab] = useState<SimulationTab>('matches');
  return { activeTab, setActiveTab };
}
