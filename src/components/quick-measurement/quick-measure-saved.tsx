import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatTime } from '@/lib/format';
import { radius, spacing } from '@/theme';

type Props = {
  savedAt: Date | null;
  consumption: number;
  production: number;
  consumptionDelta: number;
  productionDelta: number;
  onUndo: () => void;
};

/**
 * Quiet success state: one row instead of a full confirmation panel, so the
 * dashboard does not gain another block after saving.
 */
export function QuickMeasureSaved({
  savedAt,
  consumption,
  production,
  consumptionDelta,
  productionDelta,
  onUndo,
}: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}>
      <View style={[styles.icon, { backgroundColor: `${colors.success}1A` }]}>
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={18}
          tintColor={colors.success}
        />
      </View>

      <View style={styles.text}>
        <Text variant="bodyStrong">
          {t('dev.quickMeasure.savedAt', {
            time: savedAt ? formatTime(savedAt, locale) : '—',
          })}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {t('dev.quickMeasure.savedSummary', {
            consumption: formatNumber(consumption, locale, 0),
            production: formatNumber(production, locale, 0),
            consumptionDelta: `+${formatNumber(consumptionDelta, locale, 0)}`,
            productionDelta: `+${formatNumber(productionDelta, locale, 0)}`,
          })}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dev.quickMeasure.undo')}
        onPress={onUndo}
        hitSlop={spacing.sm}
        style={styles.undo}>
        <Text variant="caption" color="primary">
          {t('dev.quickMeasure.undo')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  undo: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
