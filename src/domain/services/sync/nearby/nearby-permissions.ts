import { PermissionsAndroid, Platform, type Permission } from 'react-native';
import { injectable } from 'tsyringe';

import {
  NearbyPermissionBlockedError,
  NearbyPermissionError,
  NearbyPreciseLocationError,
} from '@/domain/errors/nearby-errors';

@injectable()
export class NearbyPermissions {
  private required(): Permission[] {
    const apiLevel = Number(Platform.Version);
    const permissions: Permission[] = [
      // Play Services Nearby Connections checks both location permissions at
      // runtime on every API level (statuses 8034 and 8036), so they must be
      // requested even on Android 12+ where the docs suggest Bluetooth only.
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    if (apiLevel >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      );

      if (apiLevel >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
      }
    }

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

    if (!denied) {
      return;
    }

    // Android 12+ lets the user grant only approximate location. Nearby
    // Connections needs precise location, so surface a dedicated message.
    if (
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !==
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      throw new NearbyPreciseLocationError();
    }

    throw new NearbyPermissionError();
  }
}
