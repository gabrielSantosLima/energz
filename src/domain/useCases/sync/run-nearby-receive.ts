import { injectable } from 'tsyringe';

import type {
  NearbyReceiveEvent,
  NearbyReceiverSession,
} from '@/domain/entities/nearby';
import {
  SyncPayloadError,
  SyncVersionError,
} from '@/domain/errors/sync-errors';
import { Database } from '@/domain/services/database';
import { NearbySyncService } from '@/domain/services/sync/nearby/nearby-sync-service';
import { SyncSerializer } from '@/domain/services/sync/sync-serializer';
import { SetSyncDeviceNameUseCase } from '@/domain/useCases/sync/set-sync-device-name';

export type RunNearbyReceiveInput = {
  deviceName: string;
  onEvent: (event: NearbyReceiveEvent) => void;
};

@injectable()
export class RunNearbyReceiveUseCase {
  constructor(
    private readonly nearby: NearbySyncService,
    private readonly serializer: SyncSerializer,
    private readonly database: Database,
    private readonly saveDeviceName: SetSyncDeviceNameUseCase,
  ) {}

  async execute(
    input: RunNearbyReceiveInput,
  ): Promise<NearbyReceiverSession> {
    const deviceName = await this.saveDeviceName.execute(input.deviceName);

    return this.nearby.startReceiver({
      deviceName,
      handlers: {
        onDiscovering: () =>
          input.onEvent({ type: 'discovering' }),
        onPeerFound: (peer) =>
          input.onEvent({ type: 'peer-found', peer }),
        onPeerLost: (peerId) =>
          input.onEvent({ type: 'peer-lost', peerId }),
        onConnecting: (peer) =>
          input.onEvent({ type: 'connecting', peer }),
        onProgress: (progress) =>
          input.onEvent({ type: 'receiving', progress }),
        onReceived: (content) => {
          void this.parse(content, input.onEvent);
        },
        onError: (code, message) =>
          input.onEvent({ type: 'error', code, message }),
      },
    });
  }

  private async parse(
    content: string,
    onEvent: (event: NearbyReceiveEvent) => void,
  ): Promise<void> {
    try {
      const envelope = await this.serializer.parse(content);
      const schemaVersion = await this.database.getSchemaVersion();

      if (envelope.schemaVersion !== schemaVersion) {
        throw new SyncVersionError(
          'Sync file was created with a different database version.',
        );
      }

      onEvent({
        type: 'received',
        envelope,
        fileName: `energz-nearby-${Date.now()}.energz`,
      });
    } catch (cause) {
      const message =
        cause instanceof SyncPayloadError || cause instanceof SyncVersionError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Invalid sync payload.';

      onEvent({ type: 'error', code: 'invalid', message });
    }
  }
}
