import { injectable } from 'tsyringe';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/domain/entities/notification-settings';
import { NotificationSettingsStorage } from '@/domain/services/notification-settings-storage';

@injectable()
export class GetNotificationSettingsUseCase {
  constructor(private readonly storage: NotificationSettingsStorage) {}

  async execute(): Promise<NotificationSettings> {
    const stored = await this.storage.read();
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...stored };
  }
}
