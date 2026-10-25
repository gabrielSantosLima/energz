export interface BackupSettings {
  autoBackupEnabled: boolean;
  lastBackupAt: number | null;
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: false,
  lastBackupAt: null,
};
