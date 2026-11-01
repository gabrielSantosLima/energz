import { PermissionsAndroid, Platform, type Permission } from 'react-native';
import { injectable } from 'tsyringe';

import {
  NearbyPermissionBlockedError,
  NearbyPermissionError,
} from '@/domain/errors/nearby-errors';

@injectable()
export class NearbyPermissions {
  private required(): Permission[] {
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

    // Play Services Nearby Connections checks the coarse location permission at
    // runtime on every API level (status 8034), so it must be requested even on
    // Android 12+ where the docs suggest Bluetooth-only permissions.
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);

    return permissions;
  }

  async ensure(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const permissions = this.required();
    const granted = await Promise.all(
      permissions.map((permission) => PermissionsAndroid.check(permission)),
    );

    if (granted.every(Boolean)) {
      return;
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const blocked = permissions.some(
      (permission) =>
        results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    );

    if (blocked) {
      throw new NearbyPermissionBlockedError();
    }

    const denied = permissions.some(
      (permission) =>
        results[permission] !== PermissionsAndroid.RESULTS.GRANTED,
    );

    if (denied) {
      throw new NearbyPermissionError();
    }
  }
}
