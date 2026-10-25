import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber } from '@/lib/format';
import { radius, spacing, tabularNums } from '@/theme';

type Props = {
  label: string;
  value: number;
  intervalValue: number | null;
  trend: number | null;
  accent: string;
  higherIsBetter: boolean;
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

export function MetricCard({
  label,
  value,
  intervalValue,
  trend,
  accent,
  higherIsBetter,
}: Props) {
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
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
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
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.intervalRow}>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
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
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
