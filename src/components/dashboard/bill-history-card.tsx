import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { Cycle } from '@/domain/entities/cycle';
import type { EnergyBill } from '@/domain/entities/energy-bill';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

type Props = {
  cycles: Cycle[];
  bills: EnergyBill[];
};

type CycleBill = {
  cycle: Cycle;
  bill: EnergyBill | null;
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const MAX_ROWS = 6;

export function BillHistoryCard({ cycles, bills }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const rows = useMemo<CycleBill[]>(() => {
    const billsByDate = new Map<string, EnergyBill>();
    for (const bill of bills) {
      if (bill.readingDate) {
        billsByDate.set(dateKey(bill.readingDate), bill);
      }
    }

    return cycles
      .filter((cycle) => cycle.closed)
      .slice(-MAX_ROWS)
      .reverse()
      .map((cycle) => ({
        cycle,
        bill: billsByDate.get(dateKey(cycle.end.measuredAt)) ?? null,
      }));
  }, [cycles, bills]);

  const forecast = useMemo(() => {
    const samples = rows
      .filter(
        (row): row is CycleBill & { bill: EnergyBill } =>
          row.bill !== null && row.cycle.consumption > 0,
      )
      .slice(0, 2);
    const current = cycles.find((cycle) => !cycle.closed);

    if (!current || current.consumption <= 0 || samples.length < 2) {
      return null;
    }

    const totalAmount = samples.reduce(
      (sum, row) => sum + row.bill.amountCents,
      0,
    );
    const totalKwh = samples.reduce(
      (sum, row) => sum + row.cycle.consumption,
      0,
    );

    if (totalKwh <= 0) {
      return null;
    }

    return {
      amountCents: Math.round((totalAmount / totalKwh) * current.consumption),
      sampleCount: samples.length,
    };
  }, [cycles, rows]);

  const maxAmount = rows.reduce(
    (max, row) => Math.max(max, row.bill?.amountCents ?? 0),
    0,
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Text variant="label" color="textSecondary">
        {t('dashboard.billHistory')}
      </Text>

      {forecast ? (
        <View
          style={[
            styles.forecast,
            { backgroundColor: colors.primarySoft, borderColor: colors.primary },
          ]}>
          <View style={styles.forecastText}>
            <Text variant="caption" color="textSecondary">
              {t('dashboard.billForecast')}
            </Text>
            <Text variant="title">
              {formatCurrency(forecast.amountCents, locale)}
            </Text>
          </View>
          <Text variant="caption" color="textTertiary" style={styles.forecastHint}>
            {t('dashboard.billForecastHint', { count: forecast.sampleCount })}
          </Text>
        </View>
      ) : null}

      {rows.length === 0 ? (
        <Text variant="caption" color="textTertiary">
          {t('dashboard.billHistoryEmpty')}
        </Text>
      ) : (
        <View style={styles.rows}>
          {rows.map(({ cycle, bill }) => (
            <View key={cycle.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text variant="caption" color="textSecondary">
                  {formatShortDate(cycle.end.measuredAt, locale)}
                </Text>
                <Text variant="caption">
                  {bill ? formatCurrency(bill.amountCents, locale) : t('dashboard.noBill')}
                </Text>
              </View>
              <View
                style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${bill && maxAmount > 0 ? Math.max(4, (bill.amountCents / maxAmount) * 100) : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  forecast: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  forecastText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  forecastHint: { textAlign: 'right' },
  rows: { gap: spacing.md },
  row: { gap: spacing.xs },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  barTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: radius.pill,
  },
});
