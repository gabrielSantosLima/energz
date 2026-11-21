import { StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/ui/number-field';
import { Text } from '@/components/ui/text';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber } from '@/lib/format';
import { spacing } from '@/theme';

type Props = {
  consumption: number;
  production: number;
  onConsumptionChange: (value: number) => void;
  onProductionChange: (value: number) => void;
  last: { consumption: number; production: number };
  invalid: boolean;
  layout?: 'row' | 'column';
};

/**
 * Shared body of the quick measurement prototypes: the two dial fields, the
 * last reading hint and the inline validation. Each shell decides how much
 * chrome wraps it.
 */
export function QuickMeasureFields({
  consumption,
  production,
  onConsumptionChange,
  onProductionChange,
  last,
  invalid,
  layout = 'row',
}: Props) {
  const { t, locale } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.row, layout === 'column' && styles.column]}>
        <View style={styles.cell}>
          <NumberField
            label={t('dev.quickMeasure.consumption')}
            value={consumption}
            onChange={onConsumptionChange}
            min={last.consumption}
            unit="kWh"
          />
        </View>
        <View style={styles.cell}>
          <NumberField
            label={t('dev.quickMeasure.production')}
            value={production}
            onChange={onProductionChange}
            min={last.production}
            unit="kWh"
          />
        </View>
      </View>

      <Text variant="caption" color="textTertiary">
        {t('dev.quickMeasure.lastReading', {
          consumption: formatNumber(last.consumption, locale, 0),
          production: formatNumber(last.production, locale, 0),
        })}
      </Text>

      {invalid ? (
        <Text variant="caption" color="danger">
          {t('dev.quickMeasure.belowLast')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    flexDirection: 'column',
    gap: spacing.lg,
  },
  cell: { flex: 1 },
});
