import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureSuccess } from './quick-measure-success';
import { useQuickMeasureMock } from './use-quick-measure-mock';

const STEPS = 2;

/**
 * Variant C — full screen flow with one value per step. Big touch targets and
 * a single decision at a time.
 */
export function QuickMeasureWizard() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const mock = useQuickMeasureMock();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const close = () => {
    setOpen(false);
    setStep(0);
    mock.reset();
  };

  const start = () => {
    setStep(0);
    setOpen(true);
  };

  const isConsumption = step === 0;
  const value = isConsumption ? mock.consumption : mock.production;
  const minimum = isConsumption
    ? mock.last.consumption
    : mock.last.production;
  const setValue = isConsumption
    ? mock.setConsumption
    : mock.setProduction;

  const adjust = (delta: number) => {
    setValue(Math.max(minimum, value + delta));
  };

  return (
    <PrototypeStage>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dev.quickMeasure.register')}
        onPress={start}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        <View style={[styles.ctaIcon, { backgroundColor: colors.primarySoft }]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={20}
            tintColor={colors.primary}
          />
        </View>
        <View style={styles.ctaText}>
          <Text variant="bodyStrong">{t('dev.quickMeasure.ctaTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('dev.quickMeasure.ctaHint')}
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

      <Modal
        visible={open}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}>
        <View
          style={[
            styles.screen,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          {mock.phase === 'saved' ? (
            <View style={styles.body}>
              <QuickMeasureSuccess
                savedAt={mock.savedAt}
                consumption={mock.consumption}
                production={mock.production}
                consumptionDelta={mock.consumptionDelta}
                productionDelta={mock.productionDelta}
                onUndo={() => {
                  mock.undo();
                  setStep(1);
                }}
                onReset={close}
              />
            </View>
          ) : (
            <>
              <View style={styles.topBar}>
                {step > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.back')}
                    onPress={() => setStep(step - 1)}
                    style={[
                      styles.iconButton,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <SymbolView
                      name={{
                        ios: 'arrow.left',
                        android: 'arrow_back',
                        web: 'arrow_back',
                      }}
                      size={20}
                      tintColor={colors.textPrimary}
                    />
                  </Pressable>
                ) : (
                  <View style={styles.iconButton} />
                )}

                <Text variant="subtitle">{t('dev.quickMeasure.sheetTitle')}</Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('dev.quickMeasure.close')}
                  onPress={close}
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.surfaceMuted },
                  ]}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={20}
                    tintColor={colors.textPrimary}
                  />
                </Pressable>
              </View>

              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.surfaceMuted },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${((step + 1) / STEPS) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" color="textTertiary">
                {t('dev.quickMeasure.step', {
                  current: step + 1,
                  total: STEPS,
                })}
              </Text>

              <View style={styles.body}>
                <Text variant="title">
                  {isConsumption
                    ? t('dev.quickMeasure.consumption')
                    : t('dev.quickMeasure.production')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('dev.quickMeasure.lastReading', {
                    consumption: formatNumber(mock.last.consumption, locale, 0),
                    production: formatNumber(mock.last.production, locale, 0),
                  })}
                </Text>

                <Text variant="display" style={styles.value}>
                  {formatNumber(value, locale, 0)}
                  <Text variant="subtitle" color="textSecondary">
                    {' kWh'}
                  </Text>
                </Text>

                <View style={styles.adjustRow}>
                  {[-100, -10, 10, 100].map((delta) => {
                    const disabled = delta < 0 && value + delta < minimum;

                    return (
                      <Pressable
                        key={delta}
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          delta > 0
                            ? 'dev.quickMeasure.increase'
                            : 'dev.quickMeasure.decrease',
                          { value: Math.abs(delta) },
                        )}
                        disabled={disabled}
                        onPress={() => adjust(delta)}
                        style={({ pressed }) => [
                          styles.adjust,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
                          },
                        ]}>
                        <Text variant="label" color="textPrimary">
                          {`${delta > 0 ? '+' : '−'}${Math.abs(delta)}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text variant="caption" color="textTertiary" style={styles.hint}>
                  {t('dev.quickMeasure.wizardHint')}
                </Text>
              </View>

              <Button
                label={
                  step === STEPS - 1
                    ? mock.phase === 'saving'
                      ? t('dev.quickMeasure.saving')
                      : t('dev.quickMeasure.save')
                    : t('dev.quickMeasure.continue')
                }
                onPress={() => {
                  if (step === STEPS - 1) {
                    mock.save();
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={mock.phase === 'saving'}
              />
            </>
          )}
        </View>
      </Modal>
    </PrototypeStage>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { flex: 1, gap: 2 },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  value: {
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adjust: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
  },
});
