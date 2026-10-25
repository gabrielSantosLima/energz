import { create } from 'zustand';

import type { BackupSettings } from '@/domain/entities/backup-settings';
import type { BackupFileInfo } from '@/domain/services/database-backup-service';

type BackupState = {
  settings: BackupSettings | null;
  databaseBytes: number;
  backups: BackupFileInfo[];
  hydrated: boolean;
  saving: boolean;
  progress: number | null;
  apply: (payload: {
    settings: BackupSettings;
    databaseBytes: number;
    backups: BackupFileInfo[];
  }) => void;
  setSaving: (saving: boolean) => void;
  setProgress: (progress: number | null) => void;
};

export const useBackupStore = create<BackupState>((set) => ({
  settings: null,
  databaseBytes: 0,
  backups: [],
  hydrated: false,
  saving: false,
  progress: null,
  apply: ({ settings, databaseBytes, backups }) =>
    set({ settings, databaseBytes, backups, hydrated: true }),
  setSaving: (saving) => set({ saving }),
  setProgress: (progress) => set({ progress }),
}));
