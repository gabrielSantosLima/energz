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
         charges_json, flag, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );
  }

  async update(bill: EnergyBill): Promise<void> {
    const db = await this.database.get();
    await db.runAsync(
      `UPDATE energy_bills
       SET distributor = ?, reading_date = ?, amount_cents = ?, active_kwh = ?,
           injected_kwh = ?, charges_json = ?, flag = ?, source = ?, updated_at = ?
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
      bill.id,
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.get();
    await db.runAsync('DELETE FROM energy_bills WHERE id = ?', id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const db = await this.database.get();
    const placeholders = ids.map(() => '?').join(', ');
    await db.runAsync(
      `DELETE FROM energy_bills WHERE id IN (${placeholders})`,
      ...ids,
    );
  }
}
