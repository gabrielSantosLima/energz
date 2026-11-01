import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { billDate, type BillReport } from '@/domain/entities/bill-report';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency, formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing, tabularNums } from '@/theme';

type Props = {
  report: BillReport;
  captureRef?: RefObject<View | null>;
};

type RowProps = {
  label: string;
  value: string;
};

function Row({ label, value }: RowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text
        variant="bodyStrong"
        style={[{ color: colors.textPrimary }, tabularNums]}>
        {value}
      </Text>
    </View>
  );
}

export function BillReportPreview({ report, captureRef }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View
      style={[
        styles.preview,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View
        ref={captureRef}
        collapsable={false}
        style={[styles.capture, { backgroundColor: colors.surface }]}>
        <Text variant="label" color="textSecondary">
          {t('reports.total')}
        </Text>

        <View style={styles.rows}>
          <Row
            label={t('reports.consumption')}
            value={formatEnergy(report.totals.activeKwh, locale)}
          />
          <Row
            label={t('reports.production')}
            value={formatEnergy(report.totals.injectedKwh, locale)}
          />
          <Row
            label={t('reports.amount')}
            value={formatCurrency(report.totals.amountCents, locale)}
          />
        </View>

        <Text variant="label" color="textSecondary" style={styles.tableTitle}>
          {t('reports.bills')}
        </Text>
        <View>
          <View style={styles.tableRow}>
            <Text variant="caption" color="textTertiary" style={styles.cellDate}>
              {t('reports.date')}
            </Text>
            <Text variant="caption" color="textTertiary" style={styles.cell}>
              {t('reports.consumption')}
            </Text>
            <Text variant="caption" color="textTertiary" style={styles.cell}>
              {t('reports.production')}
            </Text>
            <Text
              variant="caption"
              color="textTertiary"
              style={styles.cellAmount}>
              {t('reports.amount')}
            </Text>
          </View>
          {report.bills.map((bill) => (
            <View
              key={bill.id}
              style={[styles.tableRow, { borderTopColor: colors.border }]}>
              <Text variant="caption" style={styles.cellDate}>
                {formatDate(billDate(bill), locale)}
              </Text>
              <Text variant="caption" style={styles.cell}>
                {formatEnergy(bill.activeKwh, locale)}
              </Text>
              <Text variant="caption" style={styles.cell}>
                {formatEnergy(bill.injectedKwh, locale)}
              </Text>
              <Text
                variant="caption"
                style={[styles.cellAmount, tabularNums]}>
                {formatCurrency(bill.amountCents, locale)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  capture: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rows: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  tableTitle: {
    marginTop: spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  cellDate: { flex: 1.3 },
  cell: { flex: 1, textAlign: 'right' },
  cellAmount: { flex: 1.1, textAlign: 'right' },
});
