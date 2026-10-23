import { create } from 'zustand';

import type { AgentSettings } from '@/domain/entities/agent-settings';

type AgentSettingsState = {
  settings: AgentSettings | null;
  hydrated: boolean;
  setSettings: (settings: AgentSettings | null) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAgentSettingsStore = create<AgentSettingsState>((set) => ({
  settings: null,
  hydrated: false,
  setSettings: (settings) => set({ settings }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
