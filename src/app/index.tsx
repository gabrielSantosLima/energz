import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/dashboard/metric-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Feature = {
  key: string;
  label: string;
  icon: SymbolViewProps['name'];
  href?: Href;
  badge?: string;
};

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { summary, loading, refreshing, refresh } = useDashboardSummary();

  const features: Feature[] = [
    {
      key: 'measurements',
      label: t('dashboard.features.measurements'),
      icon: { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' },
      href: '/measurements',
    },
    {
      key: 'reports',
      label: t('dashboard.features.reports'),
      icon: { ios: 'doc.text', android: 'description', web: 'description' },
      href: '/reports',
    },
    {
      key: 'bills',
      label: t('dashboard.features.bills'),
      icon: { ios: 'bolt', android: 'bolt', web: 'bolt' },
      badge: t('common.comingSoon'),
    },
    {
      key: 'cycles',
      label: t('dashboard.features.cycles'),
      icon: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' },
      href: '/cycles',
    },
    {
      key: 'agent',
      label: t('dashboard.features.agent'),
      icon: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
      badge: t('common.comingSoon'),
    },
  ];

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <Text variant="title">{t('dashboard.title')}</Text>
        <Text variant="body" color="textSecondary">
          {t('dashboard.subtitle')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.metricsLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.metricsRow}>
          <MetricCard
            label={t('dashboard.consumption')}
            value={summary?.consumption.value ?? 0}
            trend={summary?.consumption.trend ?? null}
            accent={colors.primary}
          />
          <MetricCard
            label={t('dashboard.production')}
            value={summary?.production.value ?? 0}
            trend={summary?.production.trend ?? null}
            accent={colors.accent}
          />
        </View>
      )}

      {!loading && summary && !summary.hasData ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text variant="body" color="textSecondary">
            {t('dashboard.emptyHint')}
          </Text>
          <Button
            label={t('measurements.add')}
            onPress={() => router.push('/measurement')}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {features.map((feature, index) => {
          const disabled = !feature.href;
          const tint = disabled ? colors.textTertiary : colors.primary;

          return (
            <Pressable
              key={feature.key}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              onPress={feature.href ? () => router.push(feature.href as Href) : undefined}
              style={[
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
                <SymbolView name={feature.icon} size={20} tintColor={tint} />
              </View>

              <Text
                variant="bodyStrong"
                color={disabled ? 'textTertiary' : 'textPrimary'}
                style={styles.rowLabel}>
                {feature.label}
              </Text>

              {feature.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.surfaceSelected }]}>
                  <Text variant="caption" color="textSecondary">
                    {feature.badge}
                  </Text>
                </View>
              ) : (
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor={colors.textTertiary}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricsLoading: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
