import { PermissionsAndroid, Platform, type Permission } from 'react-native';
import { injectable } from 'tsyringe';

import { NearbyPermissionError } from '@/domain/errors/nearby-errors';

@injectable()
export class NearbyPermissions {
  async ensure(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const apiLevel = Number(Platform.Version);
    const permissions: Permission[] = [];

    if (apiLevel >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      );

      if (apiLevel >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
      }
    } else {
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const denied = permissions.some(
      (permission) =>
        results[permission] !== PermissionsAndroid.RESULTS.GRANTED,
    );

    if (denied) {
      throw new NearbyPermissionError();
    }
  }
}
