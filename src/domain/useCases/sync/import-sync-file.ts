import { inject, injectable } from 'tsyringe';

import type { SyncEnvelope } from '@/domain/entities/sync';
import { SyncVersionError } from '@/domain/errors/sync-errors';
import { Database } from '@/domain/services/database';
import {
  SYNC_TRANSPORT,
  type SyncTransport,
} from '@/domain/services/sync/sync-transport';
import { SyncSerializer } from '@/domain/services/sync/sync-serializer';

export type ImportedSyncFile = {
  envelope: SyncEnvelope;
  fileName: string;
};

@injectable()
export class ImportSyncFileUseCase {
  constructor(
    @inject(SYNC_TRANSPORT) private readonly transport: SyncTransport,
    private readonly serializer: SyncSerializer,
    private readonly database: Database,
  ) {}

  async execute(): Promise<ImportedSyncFile | null> {
    const file = await this.transport.receive();
    if (!file) {
      return null;
    }

    const envelope = await this.serializer.parse(file.content);
    const schemaVersion = await this.database.getSchemaVersion();

    if (envelope.schemaVersion !== schemaVersion) {
      throw new SyncVersionError(
        'Sync file was created with a different database version.',
      );
    }

    return { envelope, fileName: file.fileName };
  }
}
