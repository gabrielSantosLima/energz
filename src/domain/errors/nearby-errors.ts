import type { NearbyErrorCode } from '@/domain/entities/nearby';

export class NearbyError extends Error {
  constructor(
    public readonly code: NearbyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'NearbyError';
  }
}

export class NearbyPermissionError extends NearbyError {
  constructor(message = 'Nearby permissions were not granted.') {
    super('permission', message);
    this.name = 'NearbyPermissionError';
  }
}

export class NearbyPermissionBlockedError extends NearbyError {
  constructor(message = 'Nearby permissions are blocked.') {
    super('permissionBlocked', message);
    this.name = 'NearbyPermissionBlockedError';
  }
}

export class NearbyPreciseLocationError extends NearbyError {
  constructor(message = 'Precise location is required to find nearby devices.') {
    super('location', message);
    this.name = 'NearbyPreciseLocationError';
  }
}

export class NearbyBluetoothError extends NearbyError {
  constructor(message = 'Bluetooth is turned off.') {
    super('bluetooth', message);
    this.name = 'NearbyBluetoothError';
  }
}

export class NearbyUnavailableError extends NearbyError {
  constructor(message = 'Nearby sharing is not available on this device.') {
    super('unavailable', message);
    this.name = 'NearbyUnavailableError';
  }
}

const BLUETOOTH_OFF_PATTERN = /bluetooth.*(off|disabled|not enabled|turned off|unavailable)/;
const NEARBY_BLUETOOTH_CODES = /\b(8012|8038)\b/;
const NEARBY_MISSING_PERMISSION = /\b8034\b|missing_permission/;

/**
 * Nearby Connections only reports generic connection errors, so map the ones
 * that clearly point to a disabled Bluetooth adapter or a missing runtime
 * permission to actionable errors.
 */
export function toNearbyError(
  cause: unknown,
  fallback: NearbyErrorCode = 'connection',
): NearbyError {
  if (cause instanceof NearbyError) {
    return cause;
  }

  const message = cause instanceof Error ? cause.message : String(cause);
  const lower = message.toLowerCase();

  if (NEARBY_MISSING_PERMISSION.test(lower)) {
    return new NearbyError('permission', message);
  }

  if (
    BLUETOOTH_OFF_PATTERN.test(lower) ||
    NEARBY_BLUETOOTH_CODES.test(lower)
  ) {
    return new NearbyBluetoothError(message);
  }

  return new NearbyError(fallback, message);
}
