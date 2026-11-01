import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { QuickMeasureInline } from '@/components/quick-measurement/quick-measure-inline';
import { QuickMeasureSheet } from '@/components/quick-measurement/quick-measure-sheet';
import { QuickMeasureWizard } from '@/components/quick-measurement/quick-measure-wizard';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Variant = 'inline' | 'sheet' | 'wizard';

const VARIANTS: { value: Variant; labelKey: string }[] = [
  { value: 'inline', labelKey: 'dev.quickMeasure.variants.inline' },
  { value: 'sheet', labelKey: 'dev.quickMeasure.variants.sheet' },
  { value: 'wizard', labelKey: 'dev.quickMeasure.variants.wizard' },
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

      <SegmentedControl
        value={variant}
        onChange={setVariant}
        options={VARIANTS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
      />

      <Text variant="caption" color="textTertiary">
        {t(`dev.quickMeasure.variantsHint.${variant}`)}
      </Text>

      {variant === 'inline' ? <QuickMeasureInline /> : null}
      {variant === 'sheet' ? <QuickMeasureSheet /> : null}
      {variant === 'wizard' ? <QuickMeasureWizard /> : null}
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
});
