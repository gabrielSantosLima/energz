import { injectable } from 'tsyringe';

import { DeviceIdentity } from '@/domain/services/sync/device-identity';

@injectable()
export class SetSyncDeviceNameUseCase {
  constructor(private readonly identity: DeviceIdentity) {}

  async execute(name: string): Promise<string> {
    return this.identity.setDeviceName(name);
  }
}
