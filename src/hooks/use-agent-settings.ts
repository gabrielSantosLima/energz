import { useCallback, useEffect } from 'react';

import type { AgentSettings } from '@/domain/entities/agent-settings';
import { GetAgentSettingsUseCase } from '@/domain/useCases/agents/get-agent-settings';
import { SaveAgentSettingsUseCase } from '@/domain/useCases/agents/save-agent-settings';
import { useInjection } from '@/hooks/use-injection';
import { useAgentSettingsStore } from '@/store/agent-settings-store';

type UseAgentSettings = {
  settings: AgentSettings | null;
  configured: boolean;
  hydrated: boolean;
  save: (settings: AgentSettings) => Promise<AgentSettings>;
};

export function useAgentSettings(): UseAgentSettings {
  const getSettings = useInjection(GetAgentSettingsUseCase);
  const saveSettings = useInjection(SaveAgentSettingsUseCase);

  const settings = useAgentSettingsStore((state) => state.settings);
  const hydrated = useAgentSettingsStore((state) => state.hydrated);
  const setSettings = useAgentSettingsStore((state) => state.setSettings);
  const setHydrated = useAgentSettingsStore((state) => state.setHydrated);

  useEffect(() => {
    if (hydrated) {
      return;
    }

    let active = true;

    void getSettings.execute().then((stored) => {
      if (!active) {
        return;
      }
      setSettings(stored);
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [getSettings, hydrated, setSettings, setHydrated]);

  const save = useCallback(
    async (next: AgentSettings) => {
      const saved = await saveSettings.execute(next);
      setSettings(saved);
      return saved;
    },
    [saveSettings, setSettings],
  );

  return {
    settings,
    configured: settings !== null,
    hydrated,
    save,
  };
}
