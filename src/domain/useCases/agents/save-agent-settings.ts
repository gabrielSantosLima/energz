import { injectable } from 'tsyringe';

import {
  isCompleteAgentSettings,
  type AgentSettings,
} from '@/domain/entities/agent-settings';
import { AgentSettingsStorage } from '@/domain/services/agent-settings-storage';

export class InvalidAgentSettingsError extends Error {
  constructor() {
    super('Agent provider settings are incomplete.');
    this.name = 'InvalidAgentSettingsError';
  }
}

@injectable()
export class SaveAgentSettingsUseCase {
  constructor(private readonly storage: AgentSettingsStorage) {}

  async execute(settings: AgentSettings): Promise<AgentSettings> {
    const normalized: AgentSettings = {
      providerName: settings.providerName.trim(),
      apiKey: settings.apiKey.trim(),
      model: settings.model,
    };

    if (!isCompleteAgentSettings(normalized)) {
      throw new InvalidAgentSettingsError();
    }

    await this.storage.write(normalized);
    return normalized;
  }
}
