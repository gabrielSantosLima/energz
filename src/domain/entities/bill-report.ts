import type { EnergyBill } from './energy-bill';

export interface BillReportTotals {
  amountCents: number;
  activeKwh: number;
  injectedKwh: number;
}

export interface BillReport {
  bills: EnergyBill[];
  totals: BillReportTotals;
}

export function billDate(bill: EnergyBill): Date {
  return bill.readingDate ?? bill.createdAt;
}

export function buildBillReport(bills: EnergyBill[]): BillReport {
  const sorted = [...bills].sort(
    (left, right) => billDate(right).getTime() - billDate(left).getTime(),
  );

  const totals = sorted.reduce<BillReportTotals>(
    (accumulator, bill) => ({
      amountCents: accumulator.amountCents + bill.amountCents,
      activeKwh: accumulator.activeKwh + bill.activeKwh,
      injectedKwh: accumulator.injectedKwh + bill.injectedKwh,
    }),
    { amountCents: 0, activeKwh: 0, injectedKwh: 0 },
  );

  return { bills: sorted, totals };
}
