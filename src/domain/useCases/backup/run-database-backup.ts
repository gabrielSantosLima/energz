import { injectable } from 'tsyringe';

import { BackupSettingsStorage } from '@/domain/services/backup-settings-storage';
import {
  DatabaseBackupService,
  type BackupFileInfo,
} from '@/domain/services/database-backup-service';
import { NotificationService } from '@/domain/services/notification-service';
import { GetPreferencesUseCase } from '@/domain/useCases/preferences/get-preferences';
import { translate } from '@/lib/i18n';

export type RunDatabaseBackupOptions = {
  source?: 'manual' | 'background' | 'foreground';
  onProgress?: (progress: number) => void;
};

export type RunDatabaseBackupResult = BackupFileInfo & {
  lastBackupAt: number;
};

let running: Promise<RunDatabaseBackupResult> | null = null;

@injectable()
export class RunDatabaseBackupUseCase {
  constructor(
    private readonly backups: DatabaseBackupService,
    private readonly storage: BackupSettingsStorage,
    private readonly notifications: NotificationService,
    private readonly preferences: GetPreferencesUseCase,
  ) {}

  async execute(
    options: RunDatabaseBackupOptions = {},
  ): Promise<RunDatabaseBackupResult> {
    if (running) {
      return running;
    }

    running = this.perform(options).finally(() => {
      running = null;
    });
    return running;
  }

  private async perform(
    options: RunDatabaseBackupOptions,
  ): Promise<RunDatabaseBackupResult> {
    const backup = await this.backups.createBackup(options.onProgress);
    const lastBackupAt = Date.now();
    await this.storage.write({ lastBackupAt });

    if (options.source !== 'manual') {
      const preferences = await this.preferences.execute();
      const locale = preferences.locale ?? 'en';
      const hasPermission = await this.notifications.hasPermission();
      if (hasPermission) {
        await this.notifications.present(
          translate(locale, 'backup.notificationTitle'),
          translate(locale, 'backup.notificationBody'),
        );
      }
    }

    return { ...backup, lastBackupAt };
  }
}
