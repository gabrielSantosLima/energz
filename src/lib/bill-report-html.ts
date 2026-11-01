import type { BillReport } from '@/domain/entities/bill-report';
import { billDate } from '@/domain/entities/bill-report';
import type { Locale } from '@/domain/entities/preferences';
import { formatCurrency, formatDate, formatEnergy } from './format';

export type BillReportLabels = {
  title: string;
  date: string;
  consumption: string;
  production: string;
  amount: string;
  total: string;
  bills: string;
};

export function buildBillReportHtml(
  report: BillReport,
  labels: BillReportLabels,
  locale: Locale,
): string {
  const rows = report.bills
    .map(
      (bill) =>
        `<tr><td>${formatDate(billDate(bill), locale)}</td><td>${formatEnergy(
          bill.activeKwh,
          locale,
        )}</td><td>${formatEnergy(
          bill.injectedKwh,
          locale,
        )}</td><td>${formatCurrency(bill.amountCents, locale)}</td></tr>`,
    )
    .join('');

  const summary: [string, string][] = [
    [labels.consumption, formatEnergy(report.totals.activeKwh, locale)],
    [labels.production, formatEnergy(report.totals.injectedKwh, locale)],
    [labels.amount, formatCurrency(report.totals.amountCents, locale)],
  ];

  const summaryHtml = summary
    .map(
      ([label, value]) =>
        `<div class="row"><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Roboto, sans-serif; color: #0B0F19; padding: 24px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .period { color: #5A6172; margin: 0 0 16px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E4E7EC; }
      .row span { color: #5A6172; }
      h2 { font-size: 15px; margin: 24px 0 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #E4E7EC; font-size: 13px; }
      th { color: #5A6172; font-weight: 600; }
    </style>
  </head>
  <body>
    <h1>${labels.title}</h1>
    <h2>${labels.total}</h2>
    ${summaryHtml}
    <h2>${labels.bills}</h2>
    <table>
      <thead>
        <tr><th>${labels.date}</th><th>${labels.consumption}</th><th>${labels.production}</th><th>${labels.amount}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}
