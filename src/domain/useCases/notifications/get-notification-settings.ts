import { injectable } from 'tsyringe';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/domain/entities/notification-settings';
import { NotificationSettingsStorage } from '@/domain/services/notification-settings-storage';

export type NotificationSettingsResult = NotificationSettings & {
  configured: boolean;
};

@injectable()
export class GetNotificationSettingsUseCase {
  constructor(private readonly storage: NotificationSettingsStorage) {}

  async execute(): Promise<NotificationSettingsResult> {
    const stored = await this.storage.read();
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...stored,
      configured: Object.keys(stored).length > 0,
    };
  }
}
