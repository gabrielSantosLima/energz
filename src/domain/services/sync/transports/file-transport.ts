import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { injectable } from 'tsyringe';

import {
  SYNC_FILE_EXTENSION,
  SYNC_MAX_BYTES,
} from '@/domain/entities/sync';
import {
  SyncFileError,
  SyncFileTooLargeError,
  SyncSharingUnavailableError,
} from '@/domain/errors/sync-errors';
import type {
  SyncReceiveResult,
  SyncSendResult,
  SyncTransport,
} from '@/domain/services/sync/sync-transport';

const SYNC_DIRECTORY = 'sync';
const MAX_FILES = 3;

function hasSyncExtension(name: string): boolean {
  return (
    name.toLowerCase().endsWith(`.${SYNC_FILE_EXTENSION}`) ||
    name.toLowerCase().endsWith('.json')
  );
}

@injectable()
export class FileTransport implements SyncTransport {
  private directory(): Directory {
    return new Directory(Paths.cache, SYNC_DIRECTORY);
  }

  private ensureDirectory(): Directory {
    const directory = this.directory();

    if (!directory.exists) {
      directory.create({ intermediates: true });
    }

    return directory;
  }

  private prune(directory: Directory): void {
    const files = directory
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .filter((file) => hasSyncExtension(file.name))
      .sort(
        (left, right) =>
          (right.lastModified ?? 0) - (left.lastModified ?? 0),
      );

    for (const file of files.slice(MAX_FILES)) {
      file.delete();
    }
  }

  async send(content: string, fileName: string): Promise<SyncSendResult> {
    const directory = this.ensureDirectory();
    const file = new File(directory, fileName);

    file.create({ overwrite: true, intermediates: true });
    file.write(content);
    this.prune(directory);

    if (!(await Sharing.isAvailableAsync())) {
      throw new SyncSharingUnavailableError();
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: fileName,
    });

    return { fileName: file.name, size: file.size };
  }

  async receive(): Promise<SyncReceiveResult | null> {
    const picked = await File.pickFileAsync({
      multipleFiles: false,
      mimeTypes: ['*/*'],
    });

    if (picked.canceled || !picked.result) {
      return null;
    }

    const file = picked.result;
    const name = file.name;

    if (!hasSyncExtension(name)) {
      throw new SyncFileError(
        `Select a .${SYNC_FILE_EXTENSION} sync file.`,
      );
    }

    if (file.size > SYNC_MAX_BYTES) {
      throw new SyncFileTooLargeError();
    }

    const content = await file.text();

    if (content.length > SYNC_MAX_BYTES) {
      throw new SyncFileTooLargeError();
    }

    return { content, fileName: name };
  }
}
