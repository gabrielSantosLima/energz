import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { container } from '@/contexts/container';
import { DATABASE_BACKUP_TASK } from '@/domain/services/background-backup-service';
import { GetBackupSettingsUseCase } from '@/domain/useCases/backup/get-backup-settings';
import { RunDatabaseBackupUseCase } from '@/domain/useCases/backup/run-database-backup';
import { isBackupDue } from '@/lib/backup';

TaskManager.defineTask(DATABASE_BACKUP_TASK, async () => {
  try {
    const settings = await container.resolve(GetBackupSettingsUseCase).execute();
    if (!settings.autoBackupEnabled || !isBackupDue(settings.lastBackupAt)) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await container
      .resolve(RunDatabaseBackupUseCase)
      .execute({ source: 'background' });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
