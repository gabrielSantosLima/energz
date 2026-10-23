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
        (id, measured_at, consumption, production, ends_cycle, restart, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      measurement.id,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.restart ? 1 : 0,
      measurement.createdAt.getTime(),
      measurement.updatedAt.getTime(),
    );
  }

  async update(measurement: Measurement): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `UPDATE measurements
       SET measured_at = ?, consumption = ?, production = ?, ends_cycle = ?, restart = ?, updated_at = ?
       WHERE id = ?`,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.restart ? 1 : 0,
      measurement.updatedAt.getTime(),
      measurement.id,
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.get();
    await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
  }
}
