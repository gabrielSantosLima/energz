import { injectable } from 'tsyringe';

import type {
  NearbySendEvent,
  NearbySenderSession,
} from '@/domain/entities/nearby';
import { SYNC_MAX_BYTES, type SyncEnvelope } from '@/domain/entities/sync';
import { NearbyError } from '@/domain/errors/nearby-errors';
import { SyncEmptyDataError } from '@/domain/errors/sync-errors';
import { NearbySyncService } from '@/domain/services/sync/nearby/nearby-sync-service';
import { SyncSerializer } from '@/domain/services/sync/sync-serializer';
import { BuildSyncEnvelopeUseCase } from '@/domain/useCases/sync/build-sync-envelope';
import { SetSyncDeviceNameUseCase } from '@/domain/useCases/sync/set-sync-device-name';

export type RunNearbySendInput = {
  deviceName: string;
  onEvent: (event: NearbySendEvent) => void;
};

@injectable()
export class RunNearbySendUseCase {
  constructor(
    private readonly buildEnvelope: BuildSyncEnvelopeUseCase,
    private readonly serializer: SyncSerializer,
    private readonly nearby: NearbySyncService,
    private readonly saveDeviceName: SetSyncDeviceNameUseCase,
  ) {}

  async execute(input: RunNearbySendInput): Promise<NearbySenderSession> {
    await this.saveDeviceName.execute(input.deviceName);
    const envelope = await this.buildEnvelope.execute();

    if (
      envelope.measurements.length === 0 &&
      envelope.bills.length === 0 &&
      envelope.tombstones.length === 0
    ) {
      throw new SyncEmptyDataError();
    }

    return this.nearby.startSender({
      deviceName: envelope.deviceName,
      content: this.serialize(envelope),
      checksum: envelope.checksum,
      protocolVersion: envelope.protocolVersion,
      schemaVersion: envelope.schemaVersion,
      handlers: {
        onWaiting: () => input.onEvent({ type: 'waiting' }),
        onInvitation: (peer) =>
          input.onEvent({ type: 'invitation', peer }),
        onConnecting: (peer) =>
          input.onEvent({ type: 'connecting', peer }),
        onProgress: (progress) =>
          input.onEvent({ type: 'sending', progress }),
        onSent: () => input.onEvent({ type: 'sent' }),
        onError: (code, message) =>
          input.onEvent({ type: 'error', code, message }),
      },
    });
  }

  private serialize(envelope: SyncEnvelope): string {
    const content = this.serializer.toJson(envelope);

    if (content.length > SYNC_MAX_BYTES) {
      throw new NearbyError(
        'tooLarge',
        'The data is too large to send by proximity.',
      );
    }

    return content;
  }
}
