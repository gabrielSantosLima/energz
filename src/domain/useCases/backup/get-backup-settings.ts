import { injectable } from 'tsyringe';

import {
  DEFAULT_BACKUP_SETTINGS,
  type BackupSettings,
} from '@/domain/entities/backup-settings';
import { BackupSettingsStorage } from '@/domain/services/backup-settings-storage';

@injectable()
export class GetBackupSettingsUseCase {
  constructor(private readonly storage: BackupSettingsStorage) {}

  async execute(): Promise<BackupSettings> {
    const stored = await this.storage.read();
    return { ...DEFAULT_BACKUP_SETTINGS, ...stored };
  }
}
