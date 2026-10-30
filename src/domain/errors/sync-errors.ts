export class SyncPayloadError extends Error {
  constructor(message = 'Invalid sync file.') {
    super(message);
    this.name = 'SyncPayloadError';
  }
}

export class SyncVersionError extends Error {
  constructor(message = 'Unsupported sync file version.') {
    super(message);
    this.name = 'SyncVersionError';
  }
}

export class SyncChecksumError extends Error {
  constructor(message = 'Sync file checksum mismatch.') {
    super(message);
    this.name = 'SyncChecksumError';
  }
}

export class SyncFileError extends Error {
  constructor(message = 'Could not read the sync file.') {
    super(message);
    this.name = 'SyncFileError';
  }
}

export class SyncFileTooLargeError extends Error {
  constructor(message = 'The sync file is too large.') {
    super(message);
    this.name = 'SyncFileTooLargeError';
  }
}

export class SyncSharingUnavailableError extends Error {
  constructor(message = 'Sharing is not available on this device.') {
    super(message);
    this.name = 'SyncSharingUnavailableError';
  }
}

export class SyncEmptyDataError extends Error {
  constructor(message = 'There is no data to send.') {
    super(message);
    this.name = 'SyncEmptyDataError';
  }
}
