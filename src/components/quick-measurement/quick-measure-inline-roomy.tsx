import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatShortDate } from '@/lib/format';
import { motion, radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureFields } from './quick-measure-fields';
import { QuickMeasureSaved } from './quick-measure-saved';
import { useQuickMeasureMock } from './use-quick-measure-mock';

/**
 * Variant A2 — the same inline card with more air: stacked full-width fields,
 * larger padding and a divider between the header and the form.
 */
export function QuickMeasureInlineRoomy() {
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

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth },
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
