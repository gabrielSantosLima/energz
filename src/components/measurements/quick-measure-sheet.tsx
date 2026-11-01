import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { NumberField } from '@/components/ui/number-field';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate, formatTime } from '@/lib/format';
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
  onUndo: (id: string) => Promise<void>;
};

type Phase = 'idle' | 'saving' | 'saved';

export function QuickMeasureSheet({
  visible,
  lastReading,
  onClose,
  onSubmit,
  onUndo,
}: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const lastReadingRef = useRef(lastReading);
  useEffect(() => {
    lastReadingRef.current = lastReading;
  }, [lastReading]);

  const [consumption, setConsumption] = useState(0);
  const [production, setProduction] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [saved, setSaved] = useState<{
    measurement: Measurement;
    at: Date;
    previousConsumption: number;
    previousProduction: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset the form every time the sheet is opened.
  useEffect(() => {
    if (!visible) {
      return;
    }

    setConsumption(lastReadingRef.current?.consumption ?? 0);
    setProduction(lastReadingRef.current?.production ?? 0);
    setPhase('idle');
    setSaved(null);
    setError(null);
  }, [visible]);

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
      const measurement = await onSubmit({
        measuredAt: new Date(),
        consumption,
        production,
      });
      setSaved({
        measurement,
        at: new Date(),
        previousConsumption: lastReading?.consumption ?? 0,
        previousProduction: lastReading?.production ?? 0,
      });
      setPhase('saved');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t('measurements.quick.error'),
      );
      setPhase('idle');
    }
  };

  const undo = async () => {
    if (!saved || busy) {
      return;
    }

    setPhase('saving');
    setError(null);

    try {
      await onUndo(saved.measurement.id);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t('measurements.quick.undoError'),
      );
      setPhase('saved');
    }
  };

  const today = formatShortDate(new Date(), locale);
  const consumedDelta = saved
    ? saved.measurement.consumption - saved.previousConsumption
    : 0;
  const producedDelta = saved
    ? saved.measurement.production - saved.previousProduction
    : 0;

  return (
    <Modal
      visible={visible}
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
          <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('measurements.quick.close')}
            onPress={close}
            style={styles.backdropPress}
          />

          <Animated.View
            entering={SlideInDown.duration(220)}
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
              {phase === 'saved' && saved ? (
                <View style={styles.success}>
                  <View
                    style={[
                      styles.successIcon,
                      { backgroundColor: `${colors.success}1A` },
                    ]}>
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={22}
                      tintColor={colors.success}
                    />
                  </View>

                  <Text variant="subtitle">
                    {t('measurements.quick.savedTitle')}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {t('measurements.quick.savedAt', {
                      time: formatTime(saved.at, locale),
                    })}
                  </Text>
                  <Text
                    variant="caption"
                    color="textTertiary"
                    style={styles.center}>
                    {t('measurements.quick.savedSummary', {
                      consumption: formatNumber(saved.measurement.consumption, locale),
                      production: formatNumber(saved.measurement.production, locale),
                      consumptionDelta: `+${formatNumber(consumedDelta, locale)}`,
                      productionDelta: `+${formatNumber(producedDelta, locale)}`,
                    })}
                  </Text>

                  <View style={styles.successActions}>
                    <Button
                      label={t('measurements.quick.done')}
                      onPress={onClose}
                    />
                    <Button
                      label={t('measurements.quick.undo')}
                      variant="ghost"
                      onPress={() => void undo()}
                    />
                  </View>
                </View>
              ) : (
                <>
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
                  />
                  <NumberField
                    label={t('measurements.form.production')}
                    value={production}
                    onChange={setProduction}
                    min={minProduction}
                    unit="kWh"
                    error={productionError}
                  />

                  <Text variant="caption" color="textTertiary">
                    {lastReading
                      ? t('measurements.quick.lastReading', {
                          consumption: formatNumber(lastReading.consumption, locale),
                          production: formatNumber(lastReading.production, locale),
                        })
                      : t('measurements.quick.noLastReading')}
                  </Text>

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
                </>
              )}
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
  success: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: { textAlign: 'center' },
  successActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
