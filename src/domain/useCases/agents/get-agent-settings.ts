import { injectable } from 'tsyringe';

import type { AgentSettings } from '@/domain/entities/agent-settings';
import { AgentSettingsStorage } from '@/domain/services/agent-settings-storage';

@injectable()
export class GetAgentSettingsUseCase {
  constructor(private readonly storage: AgentSettingsStorage) {}

  async execute(): Promise<AgentSettings | null> {
    return this.storage.read();
  }
}
