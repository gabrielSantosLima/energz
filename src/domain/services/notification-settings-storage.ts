import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectable } from 'tsyringe';

import type { NotificationSettings } from '@/domain/entities/notification-settings';

const STORAGE_KEY = 'energz.notifications';

@injectable()
export class NotificationSettingsStorage {
  async read(): Promise<Partial<NotificationSettings>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Partial<NotificationSettings>;
    } catch {
      return {};
    }
  }

  async write(patch: Partial<NotificationSettings>): Promise<void> {
    const current = await this.read();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...patch }),
    );
  }
}
