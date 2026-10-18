import { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LineGraph, type GraphPoint } from 'react-native-graph';

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

type Series = {
  consumption: GraphPoint[];
  production: GraphPoint[];
};

const LINE_THICKNESS = 3;
const DOT_SIZE = 8;
const DOT_SIZE_ACTIVE = 12;
const ITEM_WIDTH = 76;

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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

  const maxValue = Math.max(
    1,
    ...series.consumption.map((point) => point.value),
    ...series.production.map((point) => point.value),
  );

  const count = series.consumption.length;
  const lastIndex = count - 1;
  const activeIndex =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex <= lastIndex
      ? selectedIndex
      : lastIndex;

  const xMin = series.consumption[0]?.date.getTime() ?? 0;
  const xMax = series.consumption[lastIndex]?.date.getTime() ?? 0;
  const xDiff = xMax - xMin;
  const drawingWidth = size.width - 2 * LINE_THICKNESS;
  const drawingHeight = size.height - 2 * LINE_THICKNESS;

  const position = (date: Date, value: number) => {
    const x =
      xDiff > 0
        ? Math.floor(drawingWidth * ((date.getTime() - xMin) / xDiff)) +
          LINE_THICKNESS
        : LINE_THICKNESS;
    const y =
      drawingHeight -
      Math.floor(drawingHeight * (value / maxValue)) +
      LINE_THICKNESS;
    return { x, y };
  };

  const hasData = count >= 2 && xDiff > 0;
  const range = { y: { min: 0, max: maxValue } };

  const scrollToLast = () => {
    if (lastIndex >= 0) {
      scrollRef.current?.scrollTo({
        x: lastIndex * ITEM_WIDTH,
        animated: false,
      });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const raw = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const clamped = Math.min(Math.max(raw, 0), Math.max(lastIndex, 0));
    if (clamped !== activeIndex) {
      setSelectedIndex(clamped);
    }
  };

  const renderDots = (points: GraphPoint[], color: string) =>
    points.map((point, index) => {
      const { x, y } = position(point.date, point.value);
      const active = index === activeIndex;
      const dotSize = active ? DOT_SIZE_ACTIVE : DOT_SIZE;

      return (
        <View
          key={`${color}-${index}`}
          style={[
            styles.point,
            {
              left: x - dotSize / 2,
              top: y - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: active ? color : colors.textTertiary,
              borderColor: colors.surface,
            },
          ]}
        />
      );
    });

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
          <LineGraph
            animated={false}
            points={series.consumption}
            color={colors.primary}
            lineThickness={LINE_THICKNESS}
            range={range}
            style={StyleSheet.absoluteFill}
          />
          <LineGraph
            animated={false}
            points={series.production}
            color={colors.accent}
            lineThickness={LINE_THICKNESS}
            range={range}
            style={StyleSheet.absoluteFill}
          />
          {size.width > 0 ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {renderDots(series.consumption, colors.primary)}
              {renderDots(series.production, colors.accent)}
            </View>
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
            onScroll={onScroll}
            onContentSizeChange={scrollToLast}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: Math.max(0, (wheelWidth - ITEM_WIDTH) / 2),
            }}>
            {series.consumption.map((point, index) => {
              const active = index === activeIndex;

              return (
                <View key={index} style={styles.wheelItem}>
                  <Text
                    variant="label"
                    color={active ? 'textPrimary' : 'textTertiary'}>
                    {formatShortDate(point.date, locale)}
                  </Text>
                </View>
              );
            })}
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
  point: {
    position: 'absolute',
    borderWidth: 2,
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
