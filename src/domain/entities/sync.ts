import type { BillCharge, EnergyBillSource } from './energy-bill';
import type { RecordOrigin } from './record-origin';

export const SYNC_PROTOCOL_VERSION = 1;
export const SYNC_FILE_EXTENSION = 'energz';
export const SYNC_MAX_BYTES = 5 * 1024 * 1024;

export type SyncOrigin = {
  deviceId: string;
  deviceName: string;
  receivedAt: number;
};

export type SyncMeasurement = {
  id: string;
  measuredAt: number;
  consumption: number;
  production: number;
  endsCycle: boolean;
  restart: boolean;
  createdAt: number;
  updatedAt: number;
  origin: SyncOrigin | null;
};

export type SyncBill = {
  id: string;
  distributor: string | null;
  readingDate: number | null;
  amountCents: number;
  activeKwh: number;
  injectedKwh: number;
  charges: BillCharge[];
  flag: string | null;
  source: EnergyBillSource;
  createdAt: number;
  updatedAt: number;
  origin: SyncOrigin | null;
};

export type SyncTombstone = {
  entity: 'measurement' | 'bill';
  id: string;
  deletedAt: number;
};

export type SyncEnvelopePayload = {
  protocolVersion: number;
  schemaVersion: number;
  appVersion: string;
  deviceId: string;
  deviceName: string;
  exportedAt: number;
  measurements: SyncMeasurement[];
  bills: SyncBill[];
  tombstones: SyncTombstone[];
};

export type SyncEnvelope = SyncEnvelopePayload & {
  checksum: string;
};

export type SyncCounts = {
  added: number;
  updated: number;
  unchanged: number;
  deleted: number;
};

export type SyncPreview = {
  sourceDeviceId: string;
  sourceDeviceName: string;
  exportedAt: number;
  counts: SyncCounts;
};

export type SyncResult = {
  counts: SyncCounts;
  appliedAt: number;
};

export type SyncSnapshot = {
  measurements: SyncMeasurement[];
  bills: SyncBill[];
  tombstones: SyncTombstone[];
};

export type SyncMergePlan = {
  measurementsToUpsert: {
    record: SyncMeasurement;
    origin: SyncOrigin;
    isNew: boolean;
  }[];
  billsToUpsert: {
    record: SyncBill;
    origin: SyncOrigin;
    isNew: boolean;
  }[];
  measurementIdsToDelete: string[];
  billIdsToDelete: string[];
  tombstonesToWrite: SyncTombstone[];
  tombstoneKeysToRemove: { entity: SyncTombstone['entity']; id: string }[];
  counts: SyncCounts;
};

type SyncRecord = {
  id: string;
  updatedAt: number;
  origin: SyncOrigin | null;
};

type EntityMergePlan<R extends SyncRecord> = {
  upserts: { record: R; origin: SyncOrigin; isNew: boolean }[];
  deletes: string[];
  tombstonesToWrite: SyncTombstone[];
  tombstoneKeysToRemove: { entity: SyncTombstone['entity']; id: string }[];
  added: number;
  updated: number;
  unchanged: number;
  deleted: number;
};

type MergeEntityInput<R extends SyncRecord> = {
  entity: SyncTombstone['entity'];
  localRecords: R[];
  localTombstones: SyncTombstone[];
  incomingRecords: R[];
  incomingTombstones: SyncTombstone[];
  sender: SyncOrigin;
  localDeviceId: string;
};

function mergeEntity<R extends SyncRecord>({
  entity,
  localRecords,
  localTombstones,
  incomingRecords,
  incomingTombstones,
  sender,
  localDeviceId,
}: MergeEntityInput<R>): EntityMergePlan<R> {
  const localById = new Map(localRecords.map((record) => [record.id, record]));
  const incomingById = new Map(
    incomingRecords.map((record) => [record.id, record]),
  );
  const localTombstonesById = new Map(
    localTombstones
      .filter((tombstone) => tombstone.entity === entity)
      .map((tombstone) => [tombstone.id, tombstone]),
  );
  const incomingTombstonesById = new Map(
    incomingTombstones
      .filter((tombstone) => tombstone.entity === entity)
      .map((tombstone) => [tombstone.id, tombstone]),
  );

  const ids = new Set<string>([
    ...localById.keys(),
    ...incomingById.keys(),
    ...localTombstonesById.keys(),
    ...incomingTombstonesById.keys(),
  ]);

  const plan: EntityMergePlan<R> = {
    upserts: [],
    deletes: [],
    tombstonesToWrite: [],
    tombstoneKeysToRemove: [],
    added: 0,
    updated: 0,
    unchanged: 0,
    deleted: 0,
  };

  for (const id of ids) {
    const localRecord = localById.get(id);
    const incomingRecord = incomingById.get(id);
    const localTombstone = localTombstonesById.get(id);
    const incomingTombstone = incomingTombstonesById.get(id);

    const localTimestamp = Math.max(
      localRecord?.updatedAt ?? -Infinity,
      localTombstone?.deletedAt ?? -Infinity,
    );

    const incomingRecordTimestamp = incomingRecord?.updatedAt ?? -Infinity;
    const incomingTombstoneTimestamp = incomingTombstone?.deletedAt ?? -Infinity;

    const incomingIsRecord =
      incomingRecordTimestamp > incomingTombstoneTimestamp ||
      (incomingRecordTimestamp === incomingTombstoneTimestamp &&
        incomingRecord !== undefined);

    const incomingTimestamp = incomingIsRecord
      ? incomingRecordTimestamp
      : incomingTombstoneTimestamp;

    if (!Number.isFinite(incomingTimestamp)) {
      continue;
    }

    if (incomingTimestamp < localTimestamp) {
      if (incomingRecord) {
        plan.unchanged += 1;
      }
      continue;
    }

    if (incomingTimestamp === localTimestamp) {
      const incomingWinsTie =
        incomingIsRecord &&
        incomingRecord !== undefined &&
        localRecord !== undefined &&
        sender.deviceId > localDeviceId;

      if (incomingWinsTie && incomingRecord) {
        const origin = localRecord.origin ?? incomingRecord.origin ?? sender;
        plan.upserts.push({ record: incomingRecord, origin, isNew: false });
        plan.updated += 1;
      } else if (incomingRecord) {
        plan.unchanged += 1;
      }
      continue;
    }

    if (incomingIsRecord && incomingRecord) {
      const origin = localRecord?.origin ?? incomingRecord.origin ?? sender;
      plan.upserts.push({
        record: incomingRecord,
        origin,
        isNew: localRecord === undefined,
      });

      if (localRecord) {
        plan.updated += 1;
      } else {
        plan.added += 1;
      }

      if (localTombstone) {
        plan.tombstoneKeysToRemove.push({ entity, id });
      }
      continue;
    }

    if (incomingTombstone) {
      if (localRecord) {
        plan.deletes.push(id);
        plan.deleted += 1;
      }
      plan.tombstonesToWrite.push(incomingTombstone);
    }
  }

  return plan;
}

export function buildSyncMergePlan(input: {
  local: SyncSnapshot;
  incoming: SyncEnvelope;
  localDeviceId: string;
  receivedAt: number;
}): SyncMergePlan {
  const sender: SyncOrigin = {
    deviceId: input.incoming.deviceId,
    deviceName: input.incoming.deviceName,
    receivedAt: input.receivedAt,
  };

  const measurements = mergeEntity<SyncMeasurement>({
    entity: 'measurement',
    localRecords: input.local.measurements,
    localTombstones: input.local.tombstones,
    incomingRecords: input.incoming.measurements,
    incomingTombstones: input.incoming.tombstones,
    sender,
    localDeviceId: input.localDeviceId,
  });

  const bills = mergeEntity<SyncBill>({
    entity: 'bill',
    localRecords: input.local.bills,
    localTombstones: input.local.tombstones,
    incomingRecords: input.incoming.bills,
    incomingTombstones: input.incoming.tombstones,
    sender,
    localDeviceId: input.localDeviceId,
  });

  return {
    measurementsToUpsert: measurements.upserts,
    billsToUpsert: bills.upserts,
    measurementIdsToDelete: measurements.deletes,
    billIdsToDelete: bills.deletes,
    tombstonesToWrite: [
      ...measurements.tombstonesToWrite,
      ...bills.tombstonesToWrite,
    ],
    tombstoneKeysToRemove: [
      ...measurements.tombstoneKeysToRemove,
      ...bills.tombstoneKeysToRemove,
    ],
    counts: {
      added: measurements.added + bills.added,
      updated: measurements.updated + bills.updated,
      unchanged: measurements.unchanged + bills.unchanged,
      deleted: measurements.deleted + bills.deleted,
    },
  };
}

export function originToSync(origin: RecordOrigin | null): SyncOrigin | null {
  if (!origin) {
    return null;
  }

  return {
    deviceId: origin.deviceId,
    deviceName: origin.deviceName,
    receivedAt: origin.receivedAt.getTime(),
  };
}
