import * as SQLite from 'expo-sqlite';
import { injectable } from 'tsyringe';

const DATABASE_NAME = 'energz.db';
const DATABASE_VERSION = 4;

@injectable()
export class Database {
  private database: Promise<SQLite.SQLiteDatabase> | null = null;

  async get(): Promise<SQLite.SQLiteDatabase> {
    if (!this.database) {
      this.database = this.open();
    }
    return this.database;
  }

  async getSchemaVersion(): Promise<number> {
    const database = await this.get();
    const versionRow = await database.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    return versionRow?.user_version ?? 0;
  }

  private async open(): Promise<SQLite.SQLiteDatabase> {
    const database = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await database.execAsync('PRAGMA journal_mode = WAL;');

    const versionRow = await database.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion < 1) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS measurements (
          id TEXT PRIMARY KEY NOT NULL,
          measured_at INTEGER NOT NULL,
          consumption REAL NOT NULL,
          production REAL NOT NULL,
          ends_cycle INTEGER NOT NULL DEFAULT 0,
          restart INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    }

    if (currentVersion < 2) {
      const columns = await database.getAllAsync<{ name: string }>(
        'PRAGMA table_info(measurements)',
      );
      if (!columns.some((column) => column.name === 'restart')) {
        await database.execAsync(
          'ALTER TABLE measurements ADD COLUMN restart INTEGER NOT NULL DEFAULT 0;',
        );
      }
    }

    if (currentVersion < 3) {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS energy_bills (
          id TEXT PRIMARY KEY NOT NULL,
          distributor TEXT,
          reading_date INTEGER,
          amount_cents INTEGER NOT NULL,
          active_kwh REAL NOT NULL,
          injected_kwh REAL NOT NULL,
          charges_json TEXT NOT NULL DEFAULT '[]',
          flag TEXT,
          source TEXT NOT NULL DEFAULT 'agent',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    }

    if (currentVersion < 4) {
      const measurementColumns = await database.getAllAsync<{ name: string }>(
        'PRAGMA table_info(measurements)',
      );
      if (!measurementColumns.some((column) => column.name === 'origin_device_id')) {
        await database.execAsync(`
          ALTER TABLE measurements ADD COLUMN origin_device_id TEXT;
          ALTER TABLE measurements ADD COLUMN origin_device_name TEXT;
          ALTER TABLE measurements ADD COLUMN received_at INTEGER;
        `);
      }

      const billColumns = await database.getAllAsync<{ name: string }>(
        'PRAGMA table_info(energy_bills)',
      );
      if (!billColumns.some((column) => column.name === 'origin_device_id')) {
        await database.execAsync(`
          ALTER TABLE energy_bills ADD COLUMN origin_device_id TEXT;
          ALTER TABLE energy_bills ADD COLUMN origin_device_name TEXT;
          ALTER TABLE energy_bills ADD COLUMN received_at INTEGER;
        `);
      }

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_tombstones (
          entity TEXT NOT NULL,
          record_id TEXT NOT NULL,
          deleted_at INTEGER NOT NULL,
          PRIMARY KEY (entity, record_id)
        );
      `);
    }

    if (currentVersion < DATABASE_VERSION) {
      await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    }

    return database;
  }
}
