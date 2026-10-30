import { injectable } from 'tsyringe';

import type {
  BillCharge,
  EnergyBill,
  EnergyBillSource,
} from '@/domain/entities/energy-bill';
import { Database } from '@/domain/services/database';

type EnergyBillRow = {
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

function parseCharges(raw: string): BillCharge[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BillCharge[]) : [];
  } catch {
    return [];
  }
}

function toEnergyBill(row: EnergyBillRow): EnergyBill {
  return {
    id: row.id,
    distributor: row.distributor,
    readingDate: row.reading_date === null ? null : new Date(row.reading_date),
    amountCents: row.amount_cents,
    activeKwh: row.active_kwh,
    injectedKwh: row.injected_kwh,
    charges: parseCharges(row.charges_json),
    flag: row.flag,
    source: row.source as EnergyBillSource,
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
export class EnergyBillRepository {
  constructor(private readonly database: Database) {}

  async findAll(): Promise<EnergyBill[]> {
    const db = await this.database.get();
    const rows = await db.getAllAsync<EnergyBillRow>(
      `SELECT * FROM energy_bills
       ORDER BY COALESCE(reading_date, created_at) DESC, created_at DESC`,
    );
    return rows.map(toEnergyBill);
  }

  async findById(id: string): Promise<EnergyBill | null> {
    const db = await this.database.get();
    const row = await db.getFirstAsync<EnergyBillRow>(
      'SELECT * FROM energy_bills WHERE id = ?',
      id,
    );
    return row ? toEnergyBill(row) : null;
  }

  async insert(bill: EnergyBill): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `INSERT INTO energy_bills
        (id, distributor, reading_date, amount_cents, active_kwh, injected_kwh,
         charges_json, flag, source, created_at, updated_at,
         origin_device_id, origin_device_name, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      bill.id,
      bill.distributor,
      bill.readingDate?.getTime() ?? null,
      bill.amountCents,
      bill.activeKwh,
      bill.injectedKwh,
      JSON.stringify(bill.charges),
      bill.flag,
      bill.source,
      bill.createdAt.getTime(),
      bill.updatedAt.getTime(),
      bill.origin?.deviceId ?? null,
      bill.origin?.deviceName ?? null,
      bill.origin?.receivedAt.getTime() ?? null,
    );
  }

  async update(bill: EnergyBill): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `UPDATE energy_bills
       SET distributor = ?, reading_date = ?, amount_cents = ?, active_kwh = ?,
           injected_kwh = ?, charges_json = ?, flag = ?, source = ?,
           updated_at = ?, origin_device_id = ?, origin_device_name = ?,
           received_at = ?
       WHERE id = ?`,
      bill.distributor,
      bill.readingDate?.getTime() ?? null,
      bill.amountCents,
      bill.activeKwh,
      bill.injectedKwh,
      JSON.stringify(bill.charges),
      bill.flag,
      bill.source,
      bill.updatedAt.getTime(),
      bill.origin?.deviceId ?? null,
      bill.origin?.deviceName ?? null,
      bill.origin?.receivedAt.getTime() ?? null,
      bill.id,
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.get();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM energy_bills WHERE id = ?', id);
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_tombstones (entity, record_id, deleted_at)
         VALUES ('bill', ?, ?)`,
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
        `DELETE FROM energy_bills WHERE id IN (${placeholders})`,
        ...ids,
      );

      for (const id of ids) {
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_tombstones (entity, record_id, deleted_at)
           VALUES ('bill', ?, ?)`,
          id,
          deletedAt,
        );
      }
    });
  }
}
