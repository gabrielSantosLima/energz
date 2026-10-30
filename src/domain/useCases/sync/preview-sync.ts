import { injectable } from 'tsyringe';

import {
  buildSyncMergePlan,
  type SyncEnvelope,
  type SyncPreview,
} from '@/domain/entities/sync';
import { DeviceIdentity } from '@/domain/services/sync/device-identity';
import { SyncRepository } from '@/domain/services/sync/sync-repository';

@injectable()
export class PreviewSyncUseCase {
  constructor(
    private readonly repository: SyncRepository,
    private readonly identity: DeviceIdentity,
  ) {}

  async execute(envelope: SyncEnvelope): Promise<SyncPreview> {
    const [snapshot, localDeviceId] = await Promise.all([
      this.repository.readSnapshot(),
      this.identity.getDeviceId(),
    ]);

    const plan = buildSyncMergePlan({
      local: snapshot,
      incoming: envelope,
      localDeviceId,
      receivedAt: Date.now(),
    });

    return {
      sourceDeviceId: envelope.deviceId,
      sourceDeviceName: envelope.deviceName,
      exportedAt: envelope.exportedAt,
      counts: plan.counts,
    };
  }
}
