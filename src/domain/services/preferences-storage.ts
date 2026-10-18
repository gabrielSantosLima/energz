import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectable } from 'tsyringe';

import type { Preferences } from '@/domain/entities/preferences';

const STORAGE_KEY = 'energz.preferences';

@injectable()
export class PreferencesStorage {
  async read(): Promise<Partial<Preferences>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Partial<Preferences>;
    } catch {
      return {};
    }
  }

  async write(patch: Partial<Preferences>): Promise<void> {
    const current = await this.read();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  }
}
