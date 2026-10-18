import { injectable } from 'tsyringe';

import type { Preferences } from '@/domain/entities/preferences';
import { PreferencesStorage } from '@/domain/services/preferences-storage';

@injectable()
export class GetPreferencesUseCase {
  constructor(private readonly storage: PreferencesStorage) {}

  async execute(): Promise<Partial<Preferences>> {
    return this.storage.read();
  }
}
