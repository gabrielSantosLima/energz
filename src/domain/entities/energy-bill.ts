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
