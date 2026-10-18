import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { LineGraph, type GraphPoint } from 'react-native-graph';

import { Text } from '@/components/ui/text';
import { buildCycleSeries, type Cycle } from '@/domain/entities/cycle';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

const LINE_THICKNESS = 3;
const DOT_SIZE = 8;
const DOT_SIZE_ACTIVE = 12;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 8;
const PAD_BOTTOM = 20;

type Props = {
  cycle: Cycle;
  measurements: Measurement[];
  selectedIndex?: number;
  height?: number;
  showLegend?: boolean;
};

export function CycleGraph({
  cycle,
  measurements,
  selectedIndex,
  height = 180,
  showLegend = true,
}: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const series = buildCycleSeries(cycle, measurements);
  const count = series.consumption.length;
  const lastIndex = count - 1;
  const activeIndex =
    selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex <= lastIndex
      ? selectedIndex
      : lastIndex;

  const maxValue = Math.max(
    1,
    ...series.consumption.map((point) => point.value),
    ...series.production.map((point) => point.value),
  );

  const xMin = series.consumption[0]?.date.getTime() ?? 0;
  const xMax = series.consumption[lastIndex]?.date.getTime() ?? 0;
  const xDiff = xMax - xMin;

  const plotWidth = size.width - PAD_LEFT - PAD_RIGHT;
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;
  const innerWidth = plotWidth - 2 * LINE_THICKNESS;
  const innerHeight = plotHeight - 2 * LINE_THICKNESS;

  const position = (date: Date, value: number) => {
    const x =
      xDiff > 0
        ? LINE_THICKNESS + Math.floor(innerWidth * ((date.getTime() - xMin) / xDiff))
        : LINE_THICKNESS;
    const y =
      innerHeight - Math.floor(innerHeight * (value / maxValue)) + LINE_THICKNESS;
    return { x, y };
  };

  const toY = (value: number) =>
    innerHeight - Math.floor(innerHeight * (value / maxValue)) + LINE_THICKNESS;

  const hasData = count >= 2 && xDiff > 0;
  const ticks = [maxValue, maxValue / 2, 0];
  const range = { y: { min: 0, max: maxValue } };

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

  if (!hasData) {
    return (
      <View>
        {showLegend ? (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text variant="caption" color="textSecondary">
                {t('dashboard.consumption')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text variant="caption" color="textSecondary">
                {t('dashboard.production')}
              </Text>
            </View>
          </View>
        ) : null}
        <Text variant="caption" color="textTertiary" style={styles.empty}>
          {t('dashboard.chartEmpty')}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {showLegend ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" color="textSecondary">
              {t('dashboard.consumption')}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text variant="caption" color="textSecondary">
              {t('dashboard.production')}
            </Text>
          </View>
          <Text variant="caption" color="textTertiary" style={styles.unit}>
            kWh
          </Text>
        </View>
      ) : null}

      <View
        style={[styles.graph, { height }]}
        onLayout={(event: LayoutChangeEvent) =>
          setSize(event.nativeEvent.layout)
        }>
        {size.width > 0 ? (
          <>
            <View
              style={[
                styles.plot,
                {
                  left: PAD_LEFT,
                  right: PAD_RIGHT,
                  top: PAD_TOP,
                  bottom: PAD_BOTTOM,
                },
              ]}>
              {ticks.map((value) => (
                <View
                  key={value}
                  style={[
                    styles.grid,
                    {
                      top: toY(value),
                      backgroundColor: colors.border,
                    },
                  ]}
                />
              ))}
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
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {renderDots(series.consumption, colors.primary)}
                {renderDots(series.production, colors.accent)}
              </View>
            </View>

            {ticks.map((value) => (
              <View
                key={`y-${value}`}
                style={[styles.yLabel, { top: PAD_TOP + toY(value) - 8, width: PAD_LEFT - 6 }]}>
                <Text variant="caption" color="textTertiary" style={styles.yLabelText}>
                  {formatNumber(value, locale)}
                </Text>
              </View>
            ))}

            <Text
              variant="caption"
              color="textTertiary"
              style={[styles.xLabel, { left: PAD_LEFT, bottom: 2 }]}>
              {formatShortDate(series.consumption[0].date, locale)}
            </Text>
            <Text
              variant="caption"
              color="textTertiary"
              style={[styles.xLabel, { right: PAD_RIGHT, bottom: 2 }]}>
              {formatShortDate(series.consumption[lastIndex].date, locale)}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  unit: {
    marginLeft: 'auto',
  },
  graph: {
    marginTop: spacing.sm,
  },
  plot: {
    position: 'absolute',
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  point: {
    position: 'absolute',
    borderWidth: 2,
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    alignItems: 'flex-end',
  },
  yLabelText: {
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
  },
  empty: {
    paddingVertical: spacing['2xl'],
    textAlign: 'center',
  },
});
