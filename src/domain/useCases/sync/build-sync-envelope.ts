import { injectable } from 'tsyringe';

import {
  SYNC_PROTOCOL_VERSION,
  type SyncEnvelope,
  type SyncEnvelopePayload,
} from '@/domain/entities/sync';
import { Database } from '@/domain/services/database';
import { DeviceIdentity } from '@/domain/services/sync/device-identity';
import { SyncRepository } from '@/domain/services/sync/sync-repository';
import { SyncSerializer } from '@/domain/services/sync/sync-serializer';
import { APP_VERSION } from '@/lib/app-version';

@injectable()
export class BuildSyncEnvelopeUseCase {
  constructor(
    private readonly repository: SyncRepository,
    private readonly identity: DeviceIdentity,
    private readonly serializer: SyncSerializer,
    private readonly database: Database,
  ) {}

  async execute(): Promise<SyncEnvelope> {
    const [snapshot, deviceId, deviceName, schemaVersion] = await Promise.all([
      this.repository.readSnapshot(),
      this.identity.getDeviceId(),
      this.identity.getDeviceName(),
      this.database.getSchemaVersion(),
    ]);

    const payload: SyncEnvelopePayload = {
      protocolVersion: SYNC_PROTOCOL_VERSION,
      schemaVersion,
      appVersion: APP_VERSION,
      deviceId,
      deviceName,
      exportedAt: Date.now(),
      measurements: snapshot.measurements,
      bills: snapshot.bills,
      tombstones: snapshot.tombstones,
    };

    return this.serializer.sign(payload);
  }
}
