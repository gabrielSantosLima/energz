import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { BackgroundBackupService } from '@/domain/services/background-backup-service';
import { GetBackupSettingsUseCase } from '@/domain/useCases/backup/get-backup-settings';
import { RunDatabaseBackupUseCase } from '@/domain/useCases/backup/run-database-backup';
import { useInjection } from '@/hooks/use-injection';
import { isBackupDue } from '@/lib/backup';

export function useBackupScheduler(): void {
  const getSettings = useInjection(GetBackupSettingsUseCase);
  const background = useInjection(BackgroundBackupService);
  const runBackup = useInjection(RunDatabaseBackupUseCase);
  const checking = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (checking.current) {
        return;
      }
      checking.current = true;
      try {
        const settings = await getSettings.execute();
        if (!settings.autoBackupEnabled) {
          return;
        }
        await background.enable();
        if (isBackupDue(settings.lastBackupAt)) {
          await runBackup.execute({ source: 'foreground' });
        }
      } catch {
        // Background backup is best-effort; failures surface in the backup screen.
      } finally {
        checking.current = false;
      }
    };

    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void check();
      }
    });

    return () => subscription.remove();
  }, [background, getSettings, runBackup]);
}
