import { injectable } from 'tsyringe';

import type { ThemePreference } from '@/domain/entities/preferences';
import { PreferencesStorage } from '@/domain/services/preferences-storage';

@injectable()
export class SetThemePreferenceUseCase {
  constructor(private readonly storage: PreferencesStorage) {}

  async execute(theme: ThemePreference): Promise<void> {
    await this.storage.write({ theme });
  }
}
