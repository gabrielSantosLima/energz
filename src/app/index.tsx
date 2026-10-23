import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CycleSelector } from '@/components/cycles/cycle-selector';
import { CycleChart } from '@/components/dashboard/cycle-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MetricCardSkeleton } from '@/components/dashboard/metric-card-skeleton';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/toast';
import { buildIntervals } from '@/domain/entities/measurement';
import { useAgentSetup } from '@/hooks/use-agent-setup';
import { useCycles } from '@/hooks/use-cycles';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useMeasurements } from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type FeatureTag = 'ai' | 'new';

type Feature = {
  key: string;
  label: string;
  icon: SymbolViewProps['name'];
  href?: Href;
  badge?: string;
  tags?: FeatureTag[];
  usesAgent?: boolean;
};

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const requireAgentSetup = useAgentSetup();
  const { devMode, enableDevMode } = useDevMode();
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleLogoTap = () => {
    if (devMode) {
      return;
    }
    logoTapCount.current += 1;
    if (logoTapTimer.current) {
      clearTimeout(logoTapTimer.current);
    }
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 1500);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      if (logoTapTimer.current) {
        clearTimeout(logoTapTimer.current);
      }
      enableDevMode();
      toast.show(t('dev.enabled'), 'success');
    } else {
      toast.show(t('dev.tapProgress', { count: logoTapCount.current }), 'info');
    }
  };

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
      href: '/bill-scan',
      tags: ['ai', 'new'],
      usesAgent: true,
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
      tags: ['ai'],
    },
  ];

  if (devMode) {
    features.push({
      key: 'dev',
      label: t('dev.title'),
      icon: { ios: 'hammer', android: 'build', web: 'build' },
      href: '/dev',
    });
  }

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={t('dashboard.title')}
          onPress={handleLogoTap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Pressable>
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
              onPress={
                feature.href
                  ? () => {
                      const href = feature.href as Href;
                      if (feature.usesAgent) {
                        requireAgentSetup(() => router.push(href));
                      } else {
                        router.push(href);
                      }
                    }
                  : undefined
              }
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

              {feature.tags?.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.badge,
                    {
                      backgroundColor: disabled
                        ? colors.surfaceSelected
                        : tag === 'ai'
                          ? colors.primarySoft
                          : colors.accentSoft,
                    },
                  ]}>
                  <Text
                    variant="caption"
                    color={
                      disabled
                        ? 'textSecondary'
                        : tag === 'ai'
                          ? 'primary'
                          : 'accent'
                    }>
                    {t(tag === 'ai' ? 'common.ai' : 'common.new')}
                  </Text>
                </View>
              ))}

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
