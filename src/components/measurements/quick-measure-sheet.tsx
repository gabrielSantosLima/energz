import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { NumberField } from '@/components/ui/number-field';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

export type QuickMeasurementInput = {
  measuredAt: Date;
  consumption: number;
  production: number;
};

type Props = {
  visible: boolean;
  lastReading: Measurement | null;
  onClose: () => void;
  onSubmit: (input: QuickMeasurementInput) => Promise<Measurement>;
};

type FormProps = Omit<Props, 'visible'>;

type Phase = 'idle' | 'saving';

export function QuickMeasureSheet({ visible, ...formProps }: Props) {
  // Mounting only while visible gives every open a fresh form with the values
  // prefilled, and keeps the dial inputs from starting at zero.
  return visible ? <QuickMeasureForm {...formProps} /> : null;
}

function QuickMeasureForm({ lastReading, onClose, onSubmit }: FormProps) {
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
        cause instanceof Error
          ? cause.message
          : t('measurements.quick.error'),
      );
      setPhase('idle');
    }
  };

  const today = formatShortDate(new Date(), locale);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}>
      {/* Modals live in their own window on Android, so gesture handlers need
          a root view inside it for the dial fields to respond to taps/drags. */}
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior="padding"
          keyboardVerticalOffset={0}>
          <Animated.View
            entering={FadeIn.duration(180)}
            style={styles.backdrop}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('measurements.quick.close')}
            onPress={close}
            style={styles.backdropPress}
          />

          <Animated.View
            entering={FadeIn.duration(120)}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View
              style={[styles.handle, { backgroundColor: colors.borderStrong }]}
            />

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text variant="heading">
                    {t('measurements.quick.title')}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {t('measurements.quick.today', { date: today })}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('measurements.quick.close')}
                  onPress={close}
                  disabled={busy}
                  style={[
                    styles.close,
                    { backgroundColor: colors.surfaceMuted },
                  ]}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={18}
                    tintColor={colors.textSecondary}
                  />
                </Pressable>
              </View>

              <NumberField
                label={t('measurements.form.consumption')}
                value={consumption}
                onChange={setConsumption}
                min={minConsumption}
                unit="kWh"
                error={consumptionError}
                actionLabel={
                  lastReading
                    ? t('measurements.form.restore')
                    : undefined
                }
              />
              <NumberField
                label={t('measurements.form.production')}
                value={production}
                onChange={setProduction}
                min={minProduction}
                unit="kWh"
                error={productionError}
                actionLabel={
                  lastReading
                    ? t('measurements.form.restore')
                    : undefined
                }
              />

              <Text variant="caption" color="textTertiary">
                {lastReading
                  ? t('measurements.quick.lastReading', {
                      consumption: formatNumber(
                        lastReading.consumption,
                        locale,
                      ),
                      production: formatNumber(
                        lastReading.production,
                        locale,
                      ),
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
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#00000080',
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    paddingTop: spacing.md,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
