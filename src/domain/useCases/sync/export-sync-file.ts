import { inject, injectable } from 'tsyringe';

import { SyncEmptyDataError } from '@/domain/errors/sync-errors';
import {
  SYNC_TRANSPORT,
  type SyncSendResult,
  type SyncTransport,
} from '@/domain/services/sync/sync-transport';
import { BuildSyncEnvelopeUseCase } from '@/domain/useCases/sync/build-sync-envelope';
import { SyncSerializer } from '@/domain/services/sync/sync-serializer';

function fileBaseName(deviceName: string): string {
  const normalized = deviceName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 24);

  return normalized || 'device';
}

function timestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15);
}

@injectable()
export class ExportSyncFileUseCase {
  constructor(
    private readonly buildEnvelope: BuildSyncEnvelopeUseCase,
    private readonly serializer: SyncSerializer,
    @inject(SYNC_TRANSPORT) private readonly transport: SyncTransport,
  ) {}

  async execute(): Promise<SyncSendResult> {
    const envelope = await this.buildEnvelope.execute();

    if (
      envelope.measurements.length === 0 &&
      envelope.bills.length === 0 &&
      envelope.tombstones.length === 0
    ) {
      throw new SyncEmptyDataError();
    }

    const fileName = `energz-${fileBaseName(envelope.deviceName)}-${timestamp(
      new Date(envelope.exportedAt),
    )}.energz`;

    return this.transport.send(this.serializer.toJson(envelope), fileName);
  }
}
