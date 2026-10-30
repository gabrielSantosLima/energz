import { injectable } from 'tsyringe';

import {
  buildSyncMergePlan,
  type SyncEnvelope,
  type SyncResult,
} from '@/domain/entities/sync';
import { DeviceIdentity } from '@/domain/services/sync/device-identity';
import { SyncRepository } from '@/domain/services/sync/sync-repository';
import { RunDatabaseBackupUseCase } from '@/domain/useCases/backup/run-database-backup';

@injectable()
export class ApplySyncUseCase {
  constructor(
    private readonly repository: SyncRepository,
    private readonly identity: DeviceIdentity,
    private readonly backup: RunDatabaseBackupUseCase,
  ) {}

  async execute(envelope: SyncEnvelope): Promise<SyncResult> {
    await this.backup.execute({ source: 'manual' });

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

    await this.repository.apply(plan);

    return {
      counts: plan.counts,
      appliedAt: Date.now(),
    };
  }
}
