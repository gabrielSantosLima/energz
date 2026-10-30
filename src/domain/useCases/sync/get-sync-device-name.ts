import { injectable } from 'tsyringe';

import { DeviceIdentity } from '@/domain/services/sync/device-identity';

@injectable()
export class GetSyncDeviceNameUseCase {
  constructor(private readonly identity: DeviceIdentity) {}

  async execute(): Promise<string> {
    return this.identity.getDeviceName();
  }
}
