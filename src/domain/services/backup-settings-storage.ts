import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectable } from 'tsyringe';

import type { BackupSettings } from '@/domain/entities/backup-settings';

const STORAGE_KEY = 'energz.backup';

@injectable()
export class BackupSettingsStorage {
  async read(): Promise<Partial<BackupSettings>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Partial<BackupSettings>;
    } catch {
      return {};
    }
  }

  async write(patch: Partial<BackupSettings>): Promise<void> {
    const current = await this.read();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  }
}
