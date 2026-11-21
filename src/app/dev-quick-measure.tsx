import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { QuickMeasureDock } from '@/components/quick-measurement/quick-measure-dock';
import { QuickMeasureEmbedded } from '@/components/quick-measurement/quick-measure-embedded';
import { QuickMeasureInline } from '@/components/quick-measurement/quick-measure-inline';
import { QuickMeasureInlineRoomy } from '@/components/quick-measurement/quick-measure-inline-roomy';
import { QuickMeasureInlineSteps } from '@/components/quick-measurement/quick-measure-inline-steps';
import { QuickMeasureInlineSummary } from '@/components/quick-measurement/quick-measure-inline-summary';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Variant =
  | 'inline'
  | 'roomy'
  | 'steps'
  | 'summary'
  | 'embedded'
  | 'dock';

const VARIANTS: { value: Variant; labelKey: string }[] = [
  { value: 'inline', labelKey: 'dev.quickMeasure.variants.inline' },
  { value: 'roomy', labelKey: 'dev.quickMeasure.variants.roomy' },
  { value: 'steps', labelKey: 'dev.quickMeasure.variants.steps' },
  { value: 'summary', labelKey: 'dev.quickMeasure.variants.summary' },
  { value: 'embedded', labelKey: 'dev.quickMeasure.variants.embedded' },
  { value: 'dock', labelKey: 'dev.quickMeasure.variants.dock' },
];

export default function DevQuickMeasureScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { devMode } = useDevMode();
  const [variant, setVariant] = useState<Variant>('inline');

  if (!devMode) {
    return (
      <Screen>
        <Text variant="body" color="textSecondary">
          {t('dev.off')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerText}>
          <Text variant="title">{t('dev.quickMeasure.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('dev.quickMeasure.subtitle')}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.badge,
          { backgroundColor: colors.accentSoft, borderColor: colors.border },
        ]}>
        <Text variant="caption" color="accent">
          {t('dev.quickMeasure.prototypeBadge')}
        </Text>
      </View>

      <View style={styles.picker}>
        {VARIANTS.map((option) => {
          const active = option.value === variant;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setVariant(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}>
              <Text
                variant="caption"
                color={active ? 'primary' : 'textSecondary'}>
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" color="textTertiary">
        {t(`dev.quickMeasure.variantsHint.${variant}`)}
      </Text>

      {variant === 'inline' ? <QuickMeasureInline /> : null}
      {variant === 'roomy' ? <QuickMeasureInlineRoomy /> : null}
      {variant === 'steps' ? <QuickMeasureInlineSteps /> : null}
      {variant === 'summary' ? <QuickMeasureInlineSummary /> : null}
      {variant === 'embedded' ? <QuickMeasureEmbedded /> : null}
      {variant === 'dock' ? <QuickMeasureDock /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
