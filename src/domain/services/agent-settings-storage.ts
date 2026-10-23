import * as SecureStore from 'expo-secure-store';
import { injectable } from 'tsyringe';

import {
  isCompleteAgentSettings,
  type AgentSettings,
} from '@/domain/entities/agent-settings';

const STORAGE_KEY = 'energz.agent.settings';

@injectable()
export class AgentSettingsStorage {
  async read(): Promise<AgentSettings | null> {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return isCompleteAgentSettings(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async write(settings: AgentSettings): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings));
  }
}
