import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { injectable } from 'tsyringe';

export const DATABASE_BACKUP_TASK = 'energz-database-backup';

@injectable()
export class BackgroundBackupService {
  async enable(): Promise<void> {
    const registered = await TaskManager.isTaskRegisteredAsync(
      DATABASE_BACKUP_TASK,
    );
    if (!registered) {
      await BackgroundTask.registerTaskAsync(DATABASE_BACKUP_TASK, {
        minimumInterval: 15,
      });
    }
  }

  async disable(): Promise<void> {
    const registered = await TaskManager.isTaskRegisteredAsync(
      DATABASE_BACKUP_TASK,
    );
    if (registered) {
      await BackgroundTask.unregisterTaskAsync(DATABASE_BACKUP_TASK);
    }
  }
}
