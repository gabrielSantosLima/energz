import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatEnergy, formatNumber } from '@/lib/format';
import { radius, spacing, tabularNums } from '@/theme';

export type EnergyMetric = {
  label: string;
  value: number;
  intervalValue: number | null;
  trend: number | null;
  accent: string;
  higherIsBetter: boolean;
};

type Props = {
  production: EnergyMetric;
  consumption: EnergyMetric;
  balance: number;
  onQuickAdd?: () => void;
  onEditLast?: () => void;
};

const ARROW_UP: SymbolViewProps['name'] = {
  ios: 'arrow.up.right',
  android: 'trending_up',
  web: 'trending_up',
};

const ARROW_DOWN: SymbolViewProps['name'] = {
  ios: 'arrow.down.right',
  android: 'trending_down',
  web: 'trending_down',
};

function MetricSection({
  label,
  value,
  intervalValue,
  trend,
  accent,
  higherIsBetter,
}: EnergyMetric) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const isUp = trend !== null && trend > 0;
  const isDown = trend !== null && trend < 0;
  const direction = isUp ? 'up' : isDown ? 'down' : 'flat';

  const trendColor = isUp
    ? higherIsBetter
      ? colors.success
      : colors.danger
    : isDown
      ? higherIsBetter
        ? colors.danger
        : colors.success
      : colors.textSecondary;

  return (
    <View style={styles.metric}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={styles.valueRow}>
        <Text
          variant="title"
          numberOfLines={1}
          style={[styles.value, tabularNums]}>
          {formatNumber(value, locale, 0)}
        </Text>
        <Text variant="caption" color="textTertiary">
          kWh
        </Text>
      </View>

      {intervalValue !== null ? (
        <>
          <View style={styles.intervalRow}>
            <Text
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={styles.intervalLabel}>
              {t('dashboard.sinceLastReading')}
            </Text>
            <Text variant="bodyStrong" numberOfLines={1}>
              {`${formatNumber(intervalValue, locale, 0)} kWh`}
            </Text>
          </View>
          {trend !== null && trend !== 0 ? (
            <View style={styles.trendRow}>
              {direction !== 'flat' ? (
                <SymbolView
                  name={direction === 'up' ? ARROW_UP : ARROW_DOWN}
                  size={14}
                  tintColor={trendColor}
                />
              ) : null}
              <Text
                variant="caption"
                numberOfLines={1}
                style={{ color: trendColor }}>
                {`${trend > 0 ? '+' : ''}${formatNumber(trend, locale, 0)} kWh`}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

    </View>
  );
}

export function EnergyOverviewCard({
  consumption,
  production,
  balance,
  onQuickAdd,
  onEditLast,
}: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const balanceColor =
    balance >= 0 ? colors.success : colors.textPrimary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <MetricSection {...consumption} />

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <MetricSection {...production} />

      <View style={styles.summary}>
        <Text variant="caption" color="textSecondary">
          {t('dashboard.balance')}
        </Text>
        <Text
          variant="bodyStrong"
          numberOfLines={1}
          style={[tabularNums, { color: balanceColor }]}>
          {formatEnergy(balance, locale)}
        </Text>
      </View>

      {onQuickAdd ? (
        <>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('measurements.quick.add')}
            onPress={onQuickAdd}
            style={({ pressed }) => [
              styles.action,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: colors.primarySoft },
              ]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={18}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="bodyStrong">{t('measurements.quick.add')}</Text>
              <Text variant="caption" color="textTertiary">
                {t('measurements.quick.addHint')}
              </Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={16}
              tintColor={colors.textTertiary}
            />
          </Pressable>
        </>
      ) : null}

      {onEditLast ? (
        <>
          <View
            style={[styles.actionDivider, { backgroundColor: colors.border }]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.editLastMeasurement')}
            onPress={onEditLast}
            style={({ pressed }) => [
              styles.action,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: colors.accentSoft },
              ]}>
              <SymbolView
                name={{
                  ios: 'questionmark.circle.fill',
                  android: 'help',
                  web: 'help',
                }}
                size={18}
                tintColor={colors.warning}
              />
            </View>
            <View style={styles.actionText}>
              <Text variant="bodyStrong">
                {t('dashboard.editLastMeasurement')}
              </Text>
              <Text variant="caption" color="textTertiary">
                {t('dashboard.editLastMeasurementHint')}
              </Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={16}
              tintColor={colors.textTertiary}
            />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  metric: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: { flexShrink: 1 },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  intervalLabel: {
    flexShrink: 1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingTop: spacing.md,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1, gap: 2 },
});
