import { injectable } from 'tsyringe';

import type { Locale } from '@/domain/entities/preferences';
import { PreferencesStorage } from '@/domain/services/preferences-storage';

@injectable()
export class SetLocaleUseCase {
  constructor(private readonly storage: PreferencesStorage) {}

  async execute(locale: Locale): Promise<void> {
    await this.storage.write({ locale });
  }
}
