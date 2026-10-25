import { injectable } from 'tsyringe';

import { BackupSettingsStorage } from '@/domain/services/backup-settings-storage';
import { BackgroundBackupService } from '@/domain/services/background-backup-service';
import { NotificationService } from '@/domain/services/notification-service';

export type SetAutoBackupResult = {
  notificationGranted: boolean;
};

@injectable()
export class SetAutoBackupEnabledUseCase {
  constructor(
    private readonly storage: BackupSettingsStorage,
    private readonly background: BackgroundBackupService,
    private readonly notifications: NotificationService,
  ) {}

  async execute(enabled: boolean): Promise<SetAutoBackupResult> {
    await this.storage.write({ autoBackupEnabled: enabled });

    if (!enabled) {
      await this.background.disable();
      return { notificationGranted: true };
    }

    await this.background.enable();
    const granted =
      (await this.notifications.hasPermission()) ||
      (await this.notifications.requestPermission());
    return { notificationGranted: granted };
  }
}
