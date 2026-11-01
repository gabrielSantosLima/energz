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

export class NearbyUnavailableError extends NearbyError {
  constructor(message = 'Nearby sharing is not available on this device.') {
    super('unavailable', message);
    this.name = 'NearbyUnavailableError';
  }
}
