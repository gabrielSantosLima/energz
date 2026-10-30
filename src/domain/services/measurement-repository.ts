import { injectable } from 'tsyringe';

import type { Measurement } from '@/domain/entities/measurement';
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

function toMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    measuredAt: new Date(row.measured_at),
    consumption: row.consumption,
    production: row.production,
    endsCycle: row.ends_cycle === 1,
    restart: row.restart === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    origin: row.origin_device_id
      ? {
          deviceId: row.origin_device_id,
          deviceName: row.origin_device_name ?? '',
          receivedAt: new Date(row.received_at ?? row.updated_at),
        }
      : null,
  };
}

@injectable()
export class MeasurementRepository {
  constructor(private readonly database: Database) {}

  async findAll(): Promise<Measurement[]> {
    const db = await this.database.get();
    const rows = await db.getAllAsync<MeasurementRow>(
      'SELECT * FROM measurements ORDER BY measured_at ASC',
    );
    return rows.map(toMeasurement);
  }

  async findById(id: string): Promise<Measurement | null> {
    const db = await this.database.get();
    const row = await db.getFirstAsync<MeasurementRow>(
      'SELECT * FROM measurements WHERE id = ?',
      id,
    );
    return row ? toMeasurement(row) : null;
  }

  async insert(measurement: Measurement): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `INSERT INTO measurements
        (id, measured_at, consumption, production, ends_cycle, restart,
         created_at, updated_at, origin_device_id, origin_device_name, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      measurement.id,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.restart ? 1 : 0,
      measurement.createdAt.getTime(),
      measurement.updatedAt.getTime(),
      measurement.origin?.deviceId ?? null,
      measurement.origin?.deviceName ?? null,
      measurement.origin?.receivedAt.getTime() ?? null,
    );
  }

  async update(measurement: Measurement): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `UPDATE measurements
       SET measured_at = ?, consumption = ?, production = ?, ends_cycle = ?,
           restart = ?, updated_at = ?, origin_device_id = ?,
           origin_device_name = ?, received_at = ?
       WHERE id = ?`,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.restart ? 1 : 0,
      measurement.updatedAt.getTime(),
      measurement.origin?.deviceId ?? null,
      measurement.origin?.deviceName ?? null,
      measurement.origin?.receivedAt.getTime() ?? null,
      measurement.id,
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.get();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_tombstones (entity, record_id, deleted_at)
         VALUES ('measurement', ?, ?)`,
        id,
        Date.now(),
      );
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const db = await this.database.get();
    const placeholders = ids.map(() => '?').join(', ');
    const deletedAt = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `DELETE FROM measurements WHERE id IN (${placeholders})`,
        ...ids,
      );

      for (const id of ids) {
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_tombstones (entity, record_id, deleted_at)
           VALUES ('measurement', ?, ?)`,
          id,
          deletedAt,
        );
      }
    });
  }
}
