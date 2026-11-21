import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { NumberField } from '@/components/ui/number-field';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { motion, radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureSaved } from './quick-measure-saved';
import { useQuickMeasureMock } from './use-quick-measure-mock';

const STEPS = 2;

/**
 * Variant A3 — two steps inside the same inline card. Only one full-width
 * field is visible at a time, which gives the biggest breathing room without
 * hiding the dashboard behind a modal.
 */
export function QuickMeasureInlineSteps() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const mock = useQuickMeasureMock();
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState(0);

  const close = () => {
    setExpanded(false);
    setStep(0);
    mock.reset();
  };

  const isConsumption = step === 0;
  const isLast = step === STEPS - 1;
  const value = isConsumption ? mock.consumption : mock.production;
  const minimum = isConsumption ? mock.last.consumption : mock.last.production;
  const setValue = isConsumption ? mock.setConsumption : mock.setProduction;
  const stepInvalid = value < minimum;

  const primary = () => {
    if (isLast) {
      void mock.save();
      return;
    }
    if (!stepInvalid) {
      setStep(step + 1);
    }
  };

  return (
    <PrototypeStage>
      <Animated.View
        layout={LinearTransition.duration(motion.durationBase)}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {mock.phase === 'saved' ? (
          <QuickMeasureSaved
            savedAt={mock.savedAt}
            consumption={mock.consumption}
            production={mock.production}
            consumptionDelta={mock.consumptionDelta}
            productionDelta={mock.productionDelta}
            onUndo={mock.undo}
          />
        ) : expanded ? (
          <Animated.View
            entering={FadeIn.duration(motion.durationFast)}
            style={styles.form}>
            <View style={styles.header}>
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
                    size={18}
                    tintColor={colors.textPrimary}
                  />
                </Pressable>
              ) : (
                <View style={styles.iconButton} />
              )}

              <Text variant="subtitle" style={styles.headerTitle}>
                {t('dev.quickMeasure.formTitle')}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dev.quickMeasure.close')}
                onPress={close}
                style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
                  tintColor={colors.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.progressRow}>
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
                {t('dev.quickMeasure.stepProgress', {
                  current: step + 1,
                  total: STEPS,
                })}
              </Text>
            </View>

            <View style={styles.body}>
              <Text variant="caption" color="textSecondary">
                {t('dev.quickMeasure.today', {
                  date: formatShortDate(new Date(), locale),
                })}
              </Text>

              <NumberField
                label={
                  isConsumption
                    ? t('dev.quickMeasure.consumption')
                    : t('dev.quickMeasure.production')
                }
                value={value}
                onChange={setValue}
                min={minimum}
                unit="kWh"
                error={
                  stepInvalid ? t('dev.quickMeasure.belowLast') : undefined
                }
              />

              <Text variant="caption" color="textTertiary">
                {t('dev.quickMeasure.lastReading', {
                  consumption: formatNumber(mock.last.consumption, locale, 0),
                  production: formatNumber(mock.last.production, locale, 0),
                })}
              </Text>
            </View>

            <Button
              label={
                isLast
                  ? mock.phase === 'saving'
                    ? t('dev.quickMeasure.saving')
                    : t('dev.quickMeasure.save')
                  : t('dev.quickMeasure.continue')
              }
              onPress={primary}
              disabled={mock.phase === 'saving' || stepInvalid}
            />
          </Animated.View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dev.quickMeasure.logTitle')}
            onPress={() => setExpanded(true)}
            style={({ pressed }) => [
              styles.trigger,
              { opacity: pressed ? motion.pressOpacity : 1 },
            ]}>
            <View
              style={[styles.triggerIcon, { backgroundColor: colors.primarySoft }]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={20}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.triggerText}>
              <Text variant="bodyStrong">
                {t('dev.quickMeasure.logTitle')}
              </Text>
              <Text variant="caption" color="textTertiary">
                {t('dev.quickMeasure.logHint')}
              </Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.down',
                android: 'expand_more',
                web: 'expand_more',
              }}
              size={16}
              tintColor={colors.textTertiary}
            />
          </Pressable>
        )}
      </Animated.View>
    </PrototypeStage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  form: { gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  body: { gap: spacing.md },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 52,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: { flex: 1, gap: spacing.xs },
});
