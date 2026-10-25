import { memo, useCallback, useMemo } from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

type Point = {
  date: Date;
  value: number;
};

type Props = {
  width: number;
  height: number;
  padding: { left: number; right: number; top: number; bottom: number };
  consumption: Point[];
  production: Point[];
  activeIndex: number;
  ticks?: number[];
  consumptionColor: string;
  productionColor: string;
  gridColor: string;
  inactiveDotColor: string;
};

const STROKE = 3;
const DOT_RADIUS = 4;
const DOT_RADIUS_ACTIVE = 6;
const NO_TICKS: number[] = [];

function buildPath(
  points: Point[],
  toX: (date: Date) => number,
  toY: (value: number) => number,
  topBound: number,
  bottomBound: number,
): string {
  if (points.length === 0) {
    return '';
  }

  const coords = points.map((point) => ({
    x: toX(point.date),
    y: toY(point.value),
  }));

  let path = `M ${coords[0].x} ${coords[0].y}`;

  for (let index = 0; index < coords.length - 1; index += 1) {
    const p0 = coords[index - 1] ?? coords[index];
    const p1 = coords[index];
    const p2 = coords[index + 1];
    const p3 = coords[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = Math.min(
      Math.max(p1.y + (p2.y - p0.y) / 6, topBound),
      bottomBound,
    );
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = Math.min(
      Math.max(p2.y - (p3.y - p1.y) / 6, topBound),
      bottomBound,
    );

    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return path;
}

export const GraphPlot = memo(function GraphPlot({
  width,
  height,
  padding,
  consumption,
  production,
  activeIndex,
  ticks = NO_TICKS,
  consumptionColor,
  productionColor,
  gridColor,
  inactiveDotColor,
}: Props) {
  const maxValue = Math.max(
    1,
    ...consumption.map((point) => point.value),
    ...production.map((point) => point.value),
  );
  const count = consumption.length;
  const xMin = consumption[0]?.date.getTime() ?? 0;
  const xMax = consumption[count - 1]?.date.getTime() ?? 0;
  const xDiff = xMax - xMin;
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = Math.max(0, height - padding.top - padding.bottom);

  const toX = useCallback(
    (date: Date) =>
      xDiff > 0
        ? padding.left + ((date.getTime() - xMin) / xDiff) * plotWidth
        : padding.left,
    [padding.left, plotWidth, xDiff, xMin],
  );
  const toY = useCallback(
    (value: number) =>
      padding.top + (1 - value / maxValue) * plotHeight,
    [maxValue, padding.top, plotHeight],
  );

  const topBound = padding.top;
  const bottomBound = padding.top + plotHeight;

  const staticLayer = useMemo(() => {
    const consumptionPath = buildPath(
      consumption,
      toX,
      toY,
      topBound,
      bottomBound,
    );
    const productionPath = buildPath(
      production,
      toX,
      toY,
      topBound,
      bottomBound,
    );

    return (
      <>
        {ticks.map((tick) => (
          <Line
            key={`grid-${tick}`}
            x1={padding.left}
            y1={toY(tick)}
            x2={width - padding.right}
            y2={toY(tick)}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}

        <Path
          d={productionPath}
          stroke={productionColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={consumptionPath}
          stroke={consumptionColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {consumption.map((point, index) => (
          <Circle
            key={`c-${index}`}
            cx={toX(point.date)}
            cy={toY(point.value)}
            r={DOT_RADIUS}
            fill={inactiveDotColor}
          />
        ))}

        {production.map((point, index) => (
          <Circle
            key={`p-${index}`}
            cx={toX(point.date)}
            cy={toY(point.value)}
            r={DOT_RADIUS}
            fill={inactiveDotColor}
          />
        ))}
      </>
    );
  }, [
    bottomBound,
    consumption,
    consumptionColor,
    gridColor,
    inactiveDotColor,
    padding.left,
    padding.right,
    production,
    productionColor,
    ticks,
    topBound,
    toX,
    toY,
    width,
  ]);

  const activeConsumption = consumption[activeIndex];
  const activeProduction = production[activeIndex];

  return (
    <Svg width={width} height={height}>
      {staticLayer}

      {activeConsumption ? (
        <Circle
          cx={toX(activeConsumption.date)}
          cy={toY(activeConsumption.value)}
          r={DOT_RADIUS_ACTIVE}
          fill={consumptionColor}
        />
      ) : null}
      {activeProduction ? (
        <Circle
          cx={toX(activeProduction.date)}
          cy={toY(activeProduction.value)}
          r={DOT_RADIUS_ACTIVE}
          fill={productionColor}
        />
      ) : null}
    </Svg>
  );
});
