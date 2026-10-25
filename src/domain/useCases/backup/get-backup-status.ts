import { injectable } from 'tsyringe';

import type { BackupSettings } from '@/domain/entities/backup-settings';
import {
  DatabaseBackupService,
  type BackupFileInfo,
} from '@/domain/services/database-backup-service';
import { GetBackupSettingsUseCase } from '@/domain/useCases/backup/get-backup-settings';

export type BackupStatus = {
  settings: BackupSettings;
  databaseBytes: number;
  backups: BackupFileInfo[];
};

@injectable()
export class GetBackupStatusUseCase {
  constructor(
    private readonly settings: GetBackupSettingsUseCase,
    private readonly backups: DatabaseBackupService,
  ) {}

  async execute(): Promise<BackupStatus> {
    const [settings, databaseBytes, backups] = await Promise.all([
      this.settings.execute(),
      this.backups.getDatabaseSizeBytes(),
      this.backups.listBackups(),
    ]);

    return { settings, databaseBytes, backups };
  }
}
