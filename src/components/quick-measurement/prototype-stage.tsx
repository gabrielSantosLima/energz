import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { PROTOTYPE_LAST_READING } from './use-quick-measure-mock';

type Props = {
  children?: ReactNode;
  overlay?: ReactNode;
};

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="subtitle" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Fake dashboard used to show each prototype in context. It is intentionally
 * static and lives only inside the dev prototype screen.
 */
export function PrototypeStage({ children, overlay }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View
      style={[
        styles.stage,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
      <Text variant="caption" color="textTertiary">
        {t('dev.quickMeasure.preview')}
      </Text>

      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
          <Text variant="subtitle" color="primary">
            e
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text variant="subtitle">{t('dashboard.title')}</Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {t('dashboard.subtitle')}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.overview,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Metric
          label={t('dashboard.consumption')}
          value={formatNumber(PROTOTYPE_LAST_READING.consumption, locale)}
          color={colors.primary}
        />
        <Metric
          label={t('dashboard.production')}
          value={formatNumber(PROTOTYPE_LAST_READING.production, locale)}
          color={colors.accent}
        />
      </View>

      {children}

      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  overview: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.xl,
  },
  metric: { flex: 1, gap: spacing.xs },
});
