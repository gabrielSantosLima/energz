import { StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/ui/number-field';
import { useTranslation } from '@/hooks/use-translation';
import { spacing } from '@/theme';

type Props = {
  consumption: number;
  production: number;
  onConsumptionChange: (value: number) => void;
  onProductionChange: (value: number) => void;
  minConsumption: number;
  minProduction: number;
  consumptionError?: string | null;
  productionError?: string | null;
  canRestore: boolean;
  highlightConsumption?: boolean;
  highlightProduction?: boolean;
};

/**
 * The two reading fields used by both entry points (quick card and full form).
 * The layout is intentionally stacked: full-width fields and extra spacing keep
 * the form readable on small phones.
 */
export function MeasurementValueFields({
  consumption,
  production,
  onConsumptionChange,
  onProductionChange,
  minConsumption,
  minProduction,
  consumptionError,
  productionError,
  canRestore,
  highlightConsumption = false,
  highlightProduction = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <NumberField
        label={t('measurements.form.consumption')}
        value={consumption}
        onChange={onConsumptionChange}
        min={minConsumption}
        unit="kWh"
        error={consumptionError ?? undefined}
        actionLabel={canRestore ? t('measurements.form.restore') : undefined}
        highlight={highlightConsumption}
      />
      <NumberField
        label={t('measurements.form.production')}
        value={production}
        onChange={onProductionChange}
        min={minProduction}
        unit="kWh"
        error={productionError ?? undefined}
        actionLabel={canRestore ? t('measurements.form.restore') : undefined}
        highlight={highlightProduction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
});
