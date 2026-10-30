import { injectable } from 'tsyringe';

import type { BillCharge, EnergyBillSource } from '@/domain/entities/energy-bill';
import type {
  SyncBill,
  SyncMergePlan,
  SyncMeasurement,
  SyncOrigin,
  SyncSnapshot,
} from '@/domain/entities/sync';
import { Database } from '@/domain/services/database';

type MeasurementRow = {
  id: string;
  measured_at: number;
  consumption: number;
  production: number;
  ends_cycle: number;
  restart: number;
  created_at: number;
  updated_at: number;
  origin_device_id: string | null;
  origin_device_name: string | null;
  received_at: number | null;
};

type BillRow = {
  id: string;
  distributor: string | null;
  reading_date: number | null;
  amount_cents: number;
  active_kwh: number;
  injected_kwh: number;
  charges_json: string;
  flag: string | null;
  source: string;
  created_at: number;
  updated_at: number;
  origin_device_id: string | null;
  origin_device_name: string | null;
  received_at: number | null;
};

type TombstoneRow = {
  entity: string;
  record_id: string;
  deleted_at: number;
};

function toOrigin(
  deviceId: string | null,
  deviceName: string | null,
  receivedAt: number | null,
  fallback: number,
): SyncOrigin | null {
  if (!deviceId) {
    return null;
  }

  return {
    deviceId,
    deviceName: deviceName ?? '',
    receivedAt: receivedAt ?? fallback,
  };
}

function parseCharges(raw: string): BillCharge[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BillCharge[]) : [];
  } catch {
    return [];
  }
}

function toSyncMeasurement(row: MeasurementRow): SyncMeasurement {
  return {
    id: row.id,
    measuredAt: row.measured_at,
    consumption: row.consumption,
    production: row.production,
    endsCycle: row.ends_cycle === 1,
    restart: row.restart === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    origin: toOrigin(
      row.origin_device_id,
      row.origin_device_name,
      row.received_at,
      row.updated_at,
    ),
  };
}

function toSyncBill(row: BillRow): SyncBill {
  return {
    id: row.id,
    distributor: row.distributor,
    readingDate: row.reading_date,
    amountCents: row.amount_cents,
    activeKwh: row.active_kwh,
    injectedKwh: row.injected_kwh,
    charges: parseCharges(row.charges_json),
    flag: row.flag,
    source: row.source as EnergyBillSource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    origin: toOrigin(
      row.origin_device_id,
      row.origin_device_name,
      row.received_at,
      row.updated_at,
    ),
  };
}

@injectable()
export class SyncRepository {
  constructor(private readonly database: Database) {}

  async readSnapshot(): Promise<SyncSnapshot> {
    const db = await this.database.get();

    const measurementRows = await db.getAllAsync<MeasurementRow>(
      'SELECT * FROM measurements ORDER BY measured_at ASC',
    );
    const billRows = await db.getAllAsync<BillRow>(
      `SELECT * FROM energy_bills
       ORDER BY COALESCE(reading_date, created_at) ASC, created_at ASC`,
    );
    const tombstoneRows = await db.getAllAsync<TombstoneRow>(
      'SELECT * FROM sync_tombstones',
    );

    return {
      measurements: measurementRows.map(toSyncMeasurement),
      bills: billRows.map(toSyncBill),
      tombstones: tombstoneRows.map((row) => ({
        entity: row.entity === 'bill' ? 'bill' : 'measurement',
        id: row.record_id,
        deletedAt: row.deleted_at,
      })),
    };
  }

  async apply(plan: SyncMergePlan): Promise<void> {
    const db = await this.database.get();

    await db.withTransactionAsync(async () => {
      for (const { record, origin, isNew } of plan.measurementsToUpsert) {
        if (isNew) {
          await db.runAsync(
            `INSERT INTO measurements
              (id, measured_at, consumption, production, ends_cycle, restart,
               created_at, updated_at, origin_device_id, origin_device_name, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            record.id,
            record.measuredAt,
            record.consumption,
            record.production,
            record.endsCycle ? 1 : 0,
            record.restart ? 1 : 0,
            record.createdAt,
            record.updatedAt,
            origin.deviceId,
            origin.deviceName,
            origin.receivedAt,
          );
        } else {
          await db.runAsync(
            `UPDATE measurements
             SET measured_at = ?, consumption = ?, production = ?, ends_cycle = ?,
                 restart = ?, updated_at = ?, origin_device_id = ?,
                 origin_device_name = ?, received_at = ?
             WHERE id = ?`,
            record.measuredAt,
            record.consumption,
            record.production,
            record.endsCycle ? 1 : 0,
            record.restart ? 1 : 0,
            record.updatedAt,
            origin.deviceId,
            origin.deviceName,
            origin.receivedAt,
            record.id,
          );
        }
      }

      for (const { record, origin, isNew } of plan.billsToUpsert) {
        if (isNew) {
          await db.runAsync(
            `INSERT INTO energy_bills
              (id, distributor, reading_date, amount_cents, active_kwh,
               injected_kwh, charges_json, flag, source, created_at, updated_at,
               origin_device_id, origin_device_name, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            record.id,
            record.distributor,
            record.readingDate,
            record.amountCents,
            record.activeKwh,
            record.injectedKwh,
            JSON.stringify(record.charges),
            record.flag,
            record.source,
            record.createdAt,
            record.updatedAt,
            origin.deviceId,
            origin.deviceName,
            origin.receivedAt,
          );
        } else {
          await db.runAsync(
            `UPDATE energy_bills
             SET distributor = ?, reading_date = ?, amount_cents = ?,
                 active_kwh = ?, injected_kwh = ?, charges_json = ?, flag = ?,
                 source = ?, updated_at = ?, origin_device_id = ?,
                 origin_device_name = ?, received_at = ?
             WHERE id = ?`,
            record.distributor,
            record.readingDate,
            record.amountCents,
            record.activeKwh,
            record.injectedKwh,
            JSON.stringify(record.charges),
            record.flag,
            record.source,
            record.updatedAt,
            origin.deviceId,
            origin.deviceName,
            origin.receivedAt,
            record.id,
          );
        }
      }

      for (const id of plan.measurementIdsToDelete) {
        await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
      }

      for (const id of plan.billIdsToDelete) {
        await db.runAsync('DELETE FROM energy_bills WHERE id = ?', id);
      }

      for (const tombstone of plan.tombstonesToWrite) {
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_tombstones (entity, record_id, deleted_at)
           VALUES (?, ?, ?)`,
          tombstone.entity,
          tombstone.id,
          tombstone.deletedAt,
        );
      }

      for (const key of plan.tombstoneKeysToRemove) {
        await db.runAsync(
          'DELETE FROM sync_tombstones WHERE entity = ? AND record_id = ?',
          key.entity,
          key.id,
        );
      }
    });
  }
}
