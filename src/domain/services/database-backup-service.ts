import { Directory, File, Paths } from 'expo-file-system';
import { injectable } from 'tsyringe';

import { Database } from '@/domain/services/database';

const BACKUP_DIRECTORY = 'backups';
const MAX_BACKUPS = 3;

export type BackupFileInfo = {
  name: string;
  uri: string;
  size: number;
  modifiedAt: number;
};

@injectable()
export class DatabaseBackupService {
  constructor(private readonly database: Database) {}

  private directory(): Directory {
    return new Directory(Paths.document, BACKUP_DIRECTORY);
  }

  private ensureDirectory(): Directory {
    const directory = this.directory();
    if (!directory.exists) {
      directory.create({ intermediates: true });
    }
    return directory;
  }

  private sortBackups(files: BackupFileInfo[]): BackupFileInfo[] {
    return [...files].sort((a, b) => b.name.localeCompare(a.name));
  }

  async getDatabaseSizeBytes(): Promise<number> {
    const db = await this.database.get();
    const serialized = await db.serializeAsync();
    return serialized.byteLength;
  }

  async listBackups(): Promise<BackupFileInfo[]> {
    const directory = this.directory();
    if (!directory.exists) {
      return [];
    }

    const files = directory
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .filter((file) => file.name.endsWith('.db'))
      .map((file) => {
        const info = file.info();
        return {
          name: file.name,
          uri: file.uri,
          size: info.size ?? 0,
          modifiedAt: info.modificationTime ?? 0,
        };
      });

    return this.sortBackups(files);
  }

  async createBackup(
    onProgress?: (progress: number) => void,
  ): Promise<BackupFileInfo> {
    onProgress?.(0.1);
    const directory = this.ensureDirectory();
    const db = await this.database.get();

    const serialized = await db.serializeAsync();
    onProgress?.(0.7);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File(directory, `energz-${timestamp}.db`);
    file.create({ overwrite: true, intermediates: true });
    file.write(serialized);
    onProgress?.(0.9);

    await this.prune(directory);
    onProgress?.(1);

    const info = file.info();
    return {
      name: file.name,
      uri: file.uri,
      size: info.size ?? serialized.byteLength,
      modifiedAt: info.modificationTime ?? Date.now(),
    };
  }

  private async prune(directory: Directory): Promise<void> {
    const backups = await this.listBackups();
    for (const backup of backups.slice(MAX_BACKUPS)) {
      const file = new File(backup.uri);
      if (file.exists) {
        file.delete();
      }
    }

    if (!directory.exists) {
      return;
    }
  }
}
