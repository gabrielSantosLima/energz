import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { MeasurementValueFields } from '@/components/measurements/measurement-value-fields';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { motion, radius, spacing } from '@/theme';

export type QuickMeasurementInput = {
  measuredAt: Date;
  consumption: number;
  production: number;
};

type Props = {
  lastReading: Measurement | null;
  onClose: () => void;
  onSubmit: (input: QuickMeasurementInput) => Promise<Measurement>;
};

type Phase = 'idle' | 'saving';

/**
 * Inline quick entry that replaces the old bottom sheet. It keeps the same
 * validation rules as the modal, but stacks the full-width fields and gives the
 * card room to breathe inside the dashboard.
 */
export function QuickMeasureCard({ lastReading, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const [consumption, setConsumption] = useState(
    lastReading?.consumption ?? 0,
  );
  const [production, setProduction] = useState(lastReading?.production ?? 0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const minConsumption = lastReading?.consumption ?? 0;
  const minProduction = lastReading?.production ?? 0;

  const consumptionError =
    consumption <= 0
      ? t('measurements.form.positive')
      : consumption < minConsumption
        ? t('measurements.form.belowPrevious')
        : undefined;
  const productionError =
    production <= 0
      ? t('measurements.form.positive')
      : production < minProduction
        ? t('measurements.form.belowPrevious')
        : undefined;

  const valid = !consumptionError && !productionError;
  const busy = phase === 'saving';

  const close = () => {
    if (busy) {
      return;
    }
    onClose();
  };

  const save = async () => {
    if (!valid || busy) {
      return;
    }

    setPhase('saving');
    setError(null);

    try {
      await onSubmit({
        measuredAt: new Date(),
        consumption,
        production,
      });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t('measurements.quick.error'),
      );
      setPhase('idle');
    }
  };

  const today = formatShortDate(new Date(), locale);

  return (
    <Animated.View
      entering={FadeIn.duration(motion.durationFast)}
      layout={LinearTransition.duration(motion.durationBase)}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="subtitle">{t('measurements.quick.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('measurements.quick.today', { date: today })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('measurements.quick.close')}
          onPress={close}
          disabled={busy}
          style={[styles.close, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
            tintColor={colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <MeasurementValueFields
        consumption={consumption}
        production={production}
        onConsumptionChange={setConsumption}
        onProductionChange={setProduction}
        minConsumption={minConsumption}
        minProduction={minProduction}
        consumptionError={consumptionError}
        productionError={productionError}
        canRestore={Boolean(lastReading)}
      />

      <Text variant="caption" color="textTertiary">
        {lastReading
          ? t('measurements.quick.lastReading', {
              consumption: formatNumber(lastReading.consumption, locale, 0),
              production: formatNumber(lastReading.production, locale, 0),
            })
          : t('measurements.quick.noLastReading')}
      </Text>

      {!valid ? (
        <Text
          variant="caption"
          color="danger"
          accessibilityLiveRegion="polite">
          {t('measurements.quick.invalid')}
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={
            busy
              ? t('measurements.quick.saving')
              : t('measurements.quick.save')
          }
          onPress={() => void save()}
          disabled={!valid || busy}
        />
        <Button
          label={t('measurements.quick.notNow')}
          variant="ghost"
          onPress={close}
          disabled={busy}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth },
  actions: { gap: spacing.sm },
});
