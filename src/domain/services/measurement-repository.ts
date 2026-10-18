import * as SQLite from 'expo-sqlite';
import { injectable } from 'tsyringe';

import type { Measurement } from '@/domain/entities/measurement';

const DATABASE_NAME = 'energz.db';
const DATABASE_VERSION = 1;

type MeasurementRow = {
  id: string;
  measured_at: number;
  consumption: number;
  production: number;
  ends_cycle: number;
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@injectable()
export class MeasurementRepository {
  private database: Promise<SQLite.SQLiteDatabase> | null = null;

  private getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.database) {
      this.database = this.open();
    }
    return this.database;
  }

  private async open(): Promise<SQLite.SQLiteDatabase> {
    const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await database.execAsync('PRAGMA journal_mode = WAL;');

    const versionRow = await database.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion < DATABASE_VERSION) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS measurements (
          id TEXT PRIMARY KEY NOT NULL,
          measured_at INTEGER NOT NULL,
          consumption REAL NOT NULL,
          production REAL NOT NULL,
          ends_cycle INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    }

    return database;
  }

  async findAll(): Promise<Measurement[]> {
    const database = await this.getDatabase();
    const rows = await database.getAllAsync<MeasurementRow>(
      'SELECT * FROM measurements ORDER BY measured_at ASC',
    );
    return rows.map(toMeasurement);
  }

  async findById(id: string): Promise<Measurement | null> {
    const database = await this.getDatabase();
    const row = await database.getFirstAsync<MeasurementRow>(
      'SELECT * FROM measurements WHERE id = ?',
      id,
    );
    return row ? toMeasurement(row) : null;
  }

  async insert(measurement: Measurement): Promise<void> {
    const database = await this.getDatabase();
    await database.runAsync(
      `INSERT INTO measurements
        (id, measured_at, consumption, production, ends_cycle, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      measurement.id,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.createdAt.getTime(),
      measurement.updatedAt.getTime(),
    );
  }

  async update(measurement: Measurement): Promise<void> {
    const database = await this.getDatabase();
    await database.runAsync(
      `UPDATE measurements
       SET measured_at = ?, consumption = ?, production = ?, ends_cycle = ?, updated_at = ?
       WHERE id = ?`,
      measurement.measuredAt.getTime(),
      measurement.consumption,
      measurement.production,
      measurement.endsCycle ? 1 : 0,
      measurement.updatedAt.getTime(),
      measurement.id,
    );
  }

  async delete(id: string): Promise<void> {
    const database = await this.getDatabase();
    await database.runAsync('DELETE FROM measurements WHERE id = ?', id);
  }
}
