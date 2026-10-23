export type BillChargeKind = 'discount' | 'addition' | 'info';

export interface BillCharge {
  label: string;
  amountCents: number;
  kind?: BillChargeKind;
}

export interface BillDraft {
  distributor: string | null;
  readingDate: string | null;
  amountCents: number | null;
  activeKwh: number | null;
  injectedKwh: number | null;
  charges: BillCharge[];
  flag: string | null;
}

export type EnergyBillSource = 'agent' | 'manual';

export interface EnergyBillInput {
  distributor: string | null;
  readingDate: Date | null;
  amountCents: number;
  activeKwh: number;
  injectedKwh: number;
  charges: BillCharge[];
  flag: string | null;
  source: EnergyBillSource;
}

export interface EnergyBill extends EnergyBillInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
