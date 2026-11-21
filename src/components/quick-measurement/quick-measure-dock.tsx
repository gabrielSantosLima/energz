import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatShortDate } from '@/lib/format';
import { elevation, motion, radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureFields } from './quick-measure-fields';
import { QuickMeasureSaved } from './quick-measure-saved';
import { useQuickMeasureMock } from './use-quick-measure-mock';

/**
 * Variant C — a compact bar pinned above the tab bar. It expands upward in the
 * same screen, without a backdrop, so the dashboard stays readable and the
 * controls stay within thumb reach.
 */
export function QuickMeasureDock() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useTranslation();
  const mock = useQuickMeasureMock();
  const [expanded, setExpanded] = useState(false);

  const close = () => {
    setExpanded(false);
    mock.reset();
  };

  return (
    <PrototypeStage
      overlay={
        <View pointerEvents="box-none" style={styles.overlay}>
          <Animated.View
            layout={LinearTransition.duration(motion.durationBase)}
            style={[
              styles.dock,
              elevation[isDark ? 'dark' : 'light'].elevation2,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
                padding: mock.phase === 'saved' ? spacing.sm : spacing.lg,
              },
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
                  <View style={styles.headerText}>
                    <Text variant="bodyStrong">
                      {t('dev.quickMeasure.formTitle')}
                    </Text>
                    <Text variant="caption" color="textTertiary">
                      {t('dev.quickMeasure.today', {
                        date: formatShortDate(new Date(), locale),
                      })}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('dev.quickMeasure.close')}
                    onPress={close}
                    style={[
                      styles.close,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      size={16}
                      tintColor={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                <QuickMeasureFields
                  consumption={mock.consumption}
                  production={mock.production}
                  onConsumptionChange={mock.setConsumption}
                  onProductionChange={mock.setProduction}
                  last={mock.last}
                  invalid={!mock.valid}
                />

                <Button
                  label={
                    mock.phase === 'saving'
                      ? t('dev.quickMeasure.saving')
                      : t('dev.quickMeasure.save')
                  }
                  onPress={mock.save}
                  disabled={!mock.valid || mock.phase === 'saving'}
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
                  style={[
                    styles.triggerIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={18}
                    tintColor={colors.primary}
                  />
                </View>
                <View style={styles.triggerText}>
                  <Text variant="bodyStrong">
                    {t('dev.quickMeasure.logTitle')}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {t('dev.quickMeasure.dockHint')}
                  </Text>
                </View>
                <SymbolView
                  name={{
                    ios: 'chevron.up',
                    android: 'expand_less',
                    web: 'expand_less',
                  }}
                  size={16}
                  tintColor={colors.textTertiary}
                />
              </Pressable>
            )}
          </Animated.View>
        </View>
      }>
      <Text variant="caption" color="textTertiary">
        {t('dev.quickMeasure.dockStageHint')}
      </Text>
      <View style={styles.spacer} />
    </PrototypeStage>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  dock: {
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  form: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  triggerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: { flex: 1, gap: 2 },
  spacer: { height: 96 },
});
