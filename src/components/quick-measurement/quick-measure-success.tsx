import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
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
  onReset: () => void;
};

export function QuickMeasureSuccess({
  savedAt,
  consumption,
  production,
  consumptionDelta,
  productionDelta,
  onUndo,
  onReset,
}: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.icon,
          { backgroundColor: `${colors.success}1A` },
        ]}>
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={22}
          tintColor={colors.success}
        />
      </View>

      <Text variant="subtitle">{t('dev.quickMeasure.savedTitle')}</Text>
      <Text variant="caption" color="textSecondary" style={styles.center}>
        {t('dev.quickMeasure.savedAt', {
          time: savedAt ? formatTime(savedAt, locale) : '—',
        })}
      </Text>
      <Text variant="caption" color="textTertiary" style={styles.center}>
        {t('dev.quickMeasure.savedSummary', {
          consumption: formatNumber(consumption, locale),
          production: formatNumber(production, locale),
          consumptionDelta: `+${formatNumber(consumptionDelta, locale)}`,
          productionDelta: `+${formatNumber(productionDelta, locale)}`,
        })}
      </Text>

      <View style={styles.actions}>
        <Button
          label={t('dev.quickMeasure.undo')}
          variant="secondary"
          onPress={onUndo}
        />
        <Button
          label={t('dev.quickMeasure.newReading')}
          variant="ghost"
          onPress={onReset}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: { textAlign: 'center' },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
