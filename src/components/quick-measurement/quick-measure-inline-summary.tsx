import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { motion, radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureFields } from './quick-measure-fields';
import { QuickMeasureSaved } from './quick-measure-saved';
import { useQuickMeasureMock } from './use-quick-measure-mock';

/**
 * Variant A4 — the card starts as a readable summary of the last reading and
 * only swaps into the stacked fields when the user asks to update.
 */
export function QuickMeasureInlineSummary() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const mock = useQuickMeasureMock();
  const [expanded, setExpanded] = useState(false);

  const close = () => {
    setExpanded(false);
    mock.reset();
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
              <View style={styles.headerText}>
                <Text variant="subtitle">
                  {t('dev.quickMeasure.formTitle')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('dev.quickMeasure.today', {
                    date: formatShortDate(new Date(), locale),
                  })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dev.quickMeasure.close')}
                onPress={close}
                style={[styles.close, { backgroundColor: colors.surfaceMuted }]}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
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
              layout="column"
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
          <Animated.View
            entering={FadeIn.duration(motion.durationFast)}
            style={styles.summary}>
            <View style={styles.summaryHeader}>
              <Text variant="caption" color="textSecondary">
                {t('dev.quickMeasure.lastReadingTitle')}
              </Text>
              <Text variant="caption" color="textTertiary">
                {t('dev.quickMeasure.today', {
                  date: formatShortDate(new Date(), locale),
                })}
              </Text>
            </View>

            <View style={styles.metrics}>
              <View style={styles.metric}>
                <View style={styles.metricLabel}>
                  <View
                    style={[styles.dot, { backgroundColor: colors.primary }]}
                  />
                  <Text variant="caption" color="textSecondary">
                    {t('dev.quickMeasure.consumption')}
                  </Text>
                </View>
                <View style={styles.metricValue}>
                  <Text variant="title">
                    {formatNumber(mock.last.consumption, locale, 0)}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    kWh
                  </Text>
                </View>
              </View>

              <View style={styles.metric}>
                <View style={styles.metricLabel}>
                  <View
                    style={[styles.dot, { backgroundColor: colors.accent }]}
                  />
                  <Text variant="caption" color="textSecondary">
                    {t('dev.quickMeasure.production')}
                  </Text>
                </View>
                <View style={styles.metricValue}>
                  <Text variant="title">
                    {formatNumber(mock.last.production, locale, 0)}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    kWh
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <Button
              label={t('dev.quickMeasure.update')}
              variant="secondary"
              onPress={() => setExpanded(true)}
            />
          </Animated.View>
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
  summary: { gap: spacing.lg },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  metric: { flex: 1, gap: spacing.sm },
  metricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  divider: { height: StyleSheet.hairlineWidth },
});
