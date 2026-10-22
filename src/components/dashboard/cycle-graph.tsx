import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { GraphPlot } from '@/components/dashboard/graph-plot';
import { Text } from '@/components/ui/text';
import { buildCycleSeries, type Cycle } from '@/domain/entities/cycle';
import type { Measurement } from '@/domain/entities/measurement';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

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
  const hasData = count >= 2 && xMax > xMin;

  const ticks = [maxValue, maxValue / 2, 0];
  const plotHeight = Math.max(0, size.height - PAD_TOP - PAD_BOTTOM);
  const labelY = (value: number) =>
    PAD_TOP + (1 - value / maxValue) * plotHeight;

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
            <GraphPlot
              width={size.width}
              height={size.height}
              padding={{
                left: PAD_LEFT,
                right: PAD_RIGHT,
                top: PAD_TOP,
                bottom: PAD_BOTTOM,
              }}
              consumption={series.consumption}
              production={series.production}
              activeIndex={activeIndex}
              ticks={ticks}
              consumptionColor={colors.primary}
              productionColor={colors.accent}
              gridColor={colors.border}
              inactiveDotColor={colors.textTertiary}
            />

            {ticks.map((value) => (
              <View
                key={`y-${value}`}
                style={[
                  styles.yLabel,
                  { top: labelY(value) - 8, width: PAD_LEFT - 6 },
                ]}>
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
