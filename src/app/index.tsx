import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CycleSelector } from '@/components/cycles/cycle-selector';
import { CycleChart } from '@/components/dashboard/cycle-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MetricCardSkeleton } from '@/components/dashboard/metric-card-skeleton';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { buildIntervals } from '@/domain/entities/measurement';
import { useCycles } from '@/hooks/use-cycles';
import { useMeasurements } from '@/hooks/use-measurements';
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
  const {
    cycles,
    loading: cyclesLoading,
    refreshing: cyclesRefreshing,
    refresh: refreshCycles,
  } = useCycles();
  const {
    measurements,
    loading: measurementsLoading,
    refreshing: measurementsRefreshing,
    refresh: refreshMeasurements,
  } = useMeasurements();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const loading = cyclesLoading || measurementsLoading;
  const refreshing = cyclesRefreshing || measurementsRefreshing;

  const refresh = useCallback(() => {
    void refreshCycles();
    void refreshMeasurements();
  }, [refreshCycles, refreshMeasurements]);

  const currentCycle =
    cycles.find((cycle) => !cycle.closed) ?? cycles[cycles.length - 1] ?? null;
  const selectedIndex = cycles.findIndex(
    (cycle) => cycle.id === (selectedCycleId ?? currentCycle?.id),
  );
  const selected = selectedIndex >= 0 ? cycles[selectedIndex] : null;

  const intervals = buildIntervals(measurements);
  let lastIntervalIndex = -1;

  if (selected) {
    const startTime = selected.start.measuredAt.getTime();
    const endTime = selected.end.measuredAt.getTime();

    for (let index = 0; index < intervals.length; index += 1) {
      const time = intervals[index].to.measuredAt.getTime();
      if (time >= startTime && time <= endTime) {
        lastIntervalIndex = index;
      }
    }
  }

  const lastInterval = lastIntervalIndex >= 0 ? intervals[lastIntervalIndex] : null;
  const previousInterval =
    lastIntervalIndex > 0 ? intervals[lastIntervalIndex - 1] : null;

  const consumptionTrend =
    lastInterval && previousInterval
      ? lastInterval.consumption - previousInterval.consumption
      : null;
  const productionTrend =
    lastInterval && previousInterval
      ? lastInterval.production - previousInterval.production
      : null;

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
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel={t('dashboard.title')}
        />
        <View style={styles.headerText}>
          <Text variant="title">{t('dashboard.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('dashboard.subtitle')}
          </Text>
        </View>
      </View>

      <CycleSelector
        cycles={cycles}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedCycleId}
      />

      {loading ? (
        <View style={styles.metricsRow}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </View>
      ) : (
        <View style={styles.metricsRow}>
          <MetricCard
            label={t('dashboard.consumption')}
            value={selected?.consumption ?? 0}
            trend={consumptionTrend}
            accent={colors.primary}
            higherIsBetter={false}
          />
          <MetricCard
            label={t('dashboard.production')}
            value={selected?.production ?? 0}
            trend={productionTrend}
            accent={colors.accent}
            higherIsBetter
          />
        </View>
      )}

      {!loading && cycles.length === 0 ? (
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

      <CycleChart
        key={selected?.id ?? 'none'}
        cycle={selected}
        measurements={measurements}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
