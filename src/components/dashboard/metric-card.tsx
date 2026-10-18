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
  trend: number | null;
  accent: string;
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

export function MetricCard({ label, value, trend, accent }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const hasTrend = trend !== null && trend !== 0;
  const direction = hasTrend ? (trend > 0 ? 'up' : 'down') : 'flat';

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
          {formatNumber(value, locale)}
        </Text>
        <Text variant="caption" color="textTertiary">
          kWh
        </Text>
      </View>

      {hasTrend ? (
        <View style={styles.trendRow}>
          <SymbolView
            name={direction === 'up' ? ARROW_UP : ARROW_DOWN}
            size={14}
            tintColor={colors.textSecondary}
          />
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {`${trend > 0 ? '+' : ''}${formatNumber(trend, locale)} kWh ${t('dashboard.vsPrevious')}`}
          </Text>
        </View>
      ) : (
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {t('dashboard.noComparison')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
