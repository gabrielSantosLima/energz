import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { GetBackupStatusUseCase } from '@/domain/useCases/backup/get-backup-status';
import { RunDatabaseBackupUseCase } from '@/domain/useCases/backup/run-database-backup';
import { SetAutoBackupEnabledUseCase } from '@/domain/useCases/backup/set-auto-backup-enabled';
import { useInjection } from '@/hooks/use-injection';
import { useBackupStore } from '@/store/backup-store';

export function useDatabaseBackup() {
  const getStatus = useInjection(GetBackupStatusUseCase);
  const setEnabled = useInjection(SetAutoBackupEnabledUseCase);
  const runBackup = useInjection(RunDatabaseBackupUseCase);

  const settings = useBackupStore((state) => state.settings);
  const databaseBytes = useBackupStore((state) => state.databaseBytes);
  const backups = useBackupStore((state) => state.backups);
  const hydrated = useBackupStore((state) => state.hydrated);
  const saving = useBackupStore((state) => state.saving);
  const progress = useBackupStore((state) => state.progress);
  const apply = useBackupStore((state) => state.apply);
  const setSaving = useBackupStore((state) => state.setSaving);
  const setProgress = useBackupStore((state) => state.setProgress);

  const reload = useCallback(async () => {
    const status = await getStatus.execute();
    apply(status);
  }, [apply, getStatus]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const setAutoBackup = useCallback(
    async (enabled: boolean) => {
      setSaving(true);
      try {
        const result = await setEnabled.execute(enabled);
        await reload();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [reload, setEnabled, setSaving],
  );

  const backupNow = useCallback(async () => {
    setSaving(true);
    setProgress(0);
    try {
      await runBackup.execute({
        source: 'manual',
        onProgress: setProgress,
      });
      await reload();
    } finally {
      setProgress(null);
      setSaving(false);
    }
  }, [reload, runBackup, setProgress, setSaving]);

  return {
    settings,
    databaseBytes,
    backups,
    hydrated,
    saving,
    progress,
    setAutoBackup,
    backupNow,
  };
}
