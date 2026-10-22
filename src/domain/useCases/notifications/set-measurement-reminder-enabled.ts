import { injectable } from 'tsyringe';

import { NotificationService } from '@/domain/services/notification-service';
import { NotificationSettingsStorage } from '@/domain/services/notification-settings-storage';

export type SetMeasurementReminderInput = {
  enabled: boolean;
  title: string;
  body: string;
};

@injectable()
export class SetMeasurementReminderEnabledUseCase {
  constructor(
    private readonly storage: NotificationSettingsStorage,
    private readonly notifications: NotificationService,
  ) {}

  async execute(input: SetMeasurementReminderInput): Promise<boolean> {
    if (input.enabled) {
      const granted =
        (await this.notifications.hasPermission()) ||
        (await this.notifications.requestPermission());
      if (!granted) {
        return false;
      }
      await this.notifications.scheduleMeasurementReminders(
        input.title,
        input.body,
      );
    } else {
      await this.notifications.cancelMeasurementReminders();
    }

    await this.storage.write({ measurementReminderEnabled: input.enabled });
    return true;
  }
}
