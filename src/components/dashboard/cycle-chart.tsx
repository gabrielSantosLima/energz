import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { GraphPlot } from '@/components/dashboard/graph-plot';
import { Text } from '@/components/ui/text';
import type { Cycle } from '@/domain/entities/cycle';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

type Props = {
  cycle: Cycle | null;
  measurements: Measurement[];
};

type Point = {
  date: Date;
  value: number;
};

type Series = {
  consumption: Point[];
  production: Point[];
};

const ITEM_WIDTH = 76;
const GRAPH_PADDING = 8;
const GRAPH_PADDING_VALUES = {
  left: GRAPH_PADDING,
  right: GRAPH_PADDING,
  top: GRAPH_PADDING,
  bottom: GRAPH_PADDING,
};

const WheelItem = memo(function WheelItem({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.wheelItem}>
      <Text variant="label" color={active ? 'textPrimary' : 'textTertiary'}>
        {label}
      </Text>
    </View>
  );
});


function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

export function CycleChart({ cycle, measurements }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [wheelWidth, setWheelWidth] = useState(0);
  const [selectedMs, setSelectedMs] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const chartStateRef = useRef({
    activeIndex: -1,
    hasData: false,
    wheelWidth: 0,
  });

  const series = useMemo<Series>(() => {
    if (!cycle) {
      return { consumption: [], production: [] };
    }

    const baseConsumption = cycle.start.consumption;
    const baseProduction = cycle.start.production;

    const inCycle = measurements.filter(
      (measurement) =>
        measurement.measuredAt.getTime() >= cycle.start.measuredAt.getTime() &&
        measurement.measuredAt.getTime() <= cycle.end.measuredAt.getTime(),
    );

    return {
      consumption: inCycle.map((measurement) => ({
        date: measurement.measuredAt,
        value: Math.max(0, measurement.consumption - baseConsumption),
      })),
      production: inCycle.map((measurement) => ({
        date: measurement.measuredAt,
        value: Math.max(0, measurement.production - baseProduction),
      })),
    };
  }, [cycle, measurements]);

  const count = series.consumption.length;
  const lastIndex = count - 1;
  const selectedIndex =
    selectedMs === null
      ? -1
      : series.consumption.findIndex(
          (point) => point.date.getTime() === selectedMs,
        );
  const activeIndex = selectedIndex >= 0 ? selectedIndex : lastIndex;

  const xMin = series.consumption[0]?.date.getTime() ?? 0;
  const xMax = series.consumption[lastIndex]?.date.getTime() ?? 0;
  const hasData = count >= 2 && xMax > xMin;

  const wheelLabels = useMemo(
    () =>
      series.consumption.map((point) => formatShortDate(point.date, locale)),
    [series.consumption, locale],
  );

  const scrollToIndex = useCallback((index: number, animated = false) => {
    scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated });
  }, []);

  const syncOffset = useCallback(
    (offsetX: number) => {
      const raw = Math.round(offsetX / ITEM_WIDTH);
      const clamped = Math.min(Math.max(raw, 0), Math.max(lastIndex, 0));
      const point = series.consumption[clamped];
      if (point) {
        setSelectedMs((current) =>
          current === point.date.getTime() ? current : point.date.getTime(),
        );
      }
    },
    [lastIndex, series.consumption],
  );

  const handleContentSizeChange = useCallback(() => {
    if (selectedMs === null && hasData) {
      scrollToIndex(lastIndex);
    }
  }, [hasData, lastIndex, scrollToIndex, selectedMs]);

  useEffect(() => {
    if (selectedMs === null && hasData && wheelWidth > 0 && lastIndex >= 0) {
      scrollToIndex(lastIndex);
    }
  }, [hasData, lastIndex, scrollToIndex, selectedMs, wheelWidth]);

  useEffect(() => {
    chartStateRef.current = { activeIndex, hasData, wheelWidth };
  }, [activeIndex, hasData, wheelWidth]);

  useFocusEffect(
    useCallback(() => {
      const state = chartStateRef.current;
      if (state.hasData && state.wheelWidth > 0 && state.activeIndex >= 0) {
        scrollToIndex(state.activeIndex);
      }
    }, [scrollToIndex]),
  );

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncOffset(event.nativeEvent.contentOffset.x);
    },
    [syncOffset],
  );

  const activeConsumption = series.consumption[activeIndex];
  const activeProduction = series.production[activeIndex];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.headerRow}>
        <Text variant="label" color="textSecondary">
          {t('dashboard.chartTitle')}
        </Text>
        {activeConsumption ? (
          <Text variant="caption" color="textTertiary">
            {formatDate(activeConsumption.date, locale)}
          </Text>
        ) : null}
      </View>

      <View style={styles.legend}>
        <Legend color={colors.primary} label={t('dashboard.consumption')} />
        <Legend color={colors.accent} label={t('dashboard.production')} />
      </View>

      {hasData ? (
        <View
          style={styles.graph}
          onLayout={(event: LayoutChangeEvent) =>
            setSize(event.nativeEvent.layout)
          }>
          {size.width > 0 ? (
            <GraphPlot
              width={size.width}
              height={size.height}
              padding={GRAPH_PADDING_VALUES}
              consumption={series.consumption}
              production={series.production}
              activeIndex={activeIndex}
              consumptionColor={colors.primary}
              productionColor={colors.accent}
              gridColor={colors.border}
              inactiveDotColor={colors.textTertiary}
            />
          ) : null}
        </View>
      ) : (
        <Text variant="caption" color="textTertiary" style={styles.empty}>
          {t('dashboard.chartEmpty')}
        </Text>
      )}

      {hasData ? (
        <View
          style={styles.wheel}
          onLayout={(event: LayoutChangeEvent) =>
            setWheelWidth(event.nativeEvent.layout.width)
          }>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScrollEndDrag={onScrollEnd}
            onMomentumScrollEnd={onScrollEnd}
            onContentSizeChange={handleContentSizeChange}
            contentContainerStyle={{
              paddingHorizontal: Math.max(0, (wheelWidth - ITEM_WIDTH) / 2),
            }}>
            {wheelLabels.map((label, index) => (
              <WheelItem
                key={index}
                label={label}
                active={index === activeIndex}
              />
            ))}
          </ScrollView>
          <View
            pointerEvents="none"
            style={[styles.marker, { backgroundColor: colors.primary }]}
          />
        </View>
      ) : null}

      {hasData && activeConsumption && activeProduction ? (
        <View style={styles.values}>
          <Text variant="caption" color="textSecondary">
            {`${t('dashboard.consumption')}: ${formatEnergy(activeConsumption.value, locale)}`}
          </Text>
          <Text variant="caption" color="textSecondary">
            {`${t('dashboard.production')}: ${formatEnergy(activeProduction.value, locale)}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  graph: {
    height: 180,
    marginTop: spacing.sm,
  },
  wheel: {
    marginTop: spacing.sm,
  },
  wheelItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  marker: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
    width: 24,
    height: 2,
    borderRadius: radius.pill,
  },
  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  empty: {
    paddingVertical: spacing['2xl'],
    textAlign: 'center',
  },
});
