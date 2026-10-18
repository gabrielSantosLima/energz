import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { CycleGraph } from '@/components/dashboard/cycle-graph';
import { Text } from '@/components/ui/text';
import type { Report } from '@/domain/entities/report';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing, tabularNums } from '@/theme';

type Props = {
  report: Report;
  captureRef?: RefObject<View | null>;
};

type RowProps = {
  label: string;
  value: string;
  color?: string;
};

function Row({ label, value, color }: RowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" style={[{ color: colors.textPrimary }, color ? { color } : null, tabularNums]}>
        {value}
      </Text>
    </View>
  );
}

export function ReportPreview({ report, captureRef }: Props) {
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
          {t('reports.period')}
        </Text>
        <Text variant="body">
          {`${formatDate(report.cycle.start.measuredAt, locale)} - ${formatDate(report.cycle.end.measuredAt, locale)}`}
        </Text>

        <View style={styles.rows}>
          <Row
            label={t('reports.production')}
            value={formatEnergy(report.cycle.production, locale)}
          />
          <Row
            label={t('reports.consumption')}
            value={formatEnergy(report.cycle.consumption, locale)}
          />
          <Row
            label={t('reports.balance')}
            value={formatEnergy(report.cycle.balance, locale)}
            color={report.cycle.balance >= 0 ? colors.success : colors.danger}
          />
        </View>

        <View style={styles.chart}>
          <CycleGraph
            cycle={report.cycle}
            measurements={report.measurements}
            height={200}
          />
        </View>
      </View>

      <Text variant="label" color="textSecondary" style={styles.tableTitle}>
        {t('reports.measurements')}
      </Text>
      <View>
        <View style={styles.tableRow}>
          <Text variant="caption" color="textTertiary" style={styles.cellWide}>
            {t('reports.date')}
          </Text>
          <Text variant="caption" color="textTertiary" style={styles.cell}>
            {t('reports.consumption')}
          </Text>
          <Text variant="caption" color="textTertiary" style={styles.cell}>
            {t('reports.production')}
          </Text>
        </View>
        {report.measurements.map((measurement) => (
          <View
            key={measurement.id}
            style={[styles.tableRow, { borderTopColor: colors.border }]}>
            <Text variant="caption" style={styles.cellWide}>
              {formatDate(measurement.measuredAt, locale)}
            </Text>
            <Text variant="caption" style={styles.cell}>
              {formatEnergy(measurement.consumption, locale)}
            </Text>
            <Text variant="caption" style={styles.cell}>
              {formatEnergy(measurement.production, locale)}
            </Text>
          </View>
        ))}
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
  chart: {
    marginTop: spacing.md,
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
  cellWide: { flex: 1.4 },
  cell: { flex: 1, textAlign: 'right' },
});
