import { Canvas, Circle, Line, Path, Skia, vec } from '@shopify/react-native-skia';

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

export function GraphPlot({
  width,
  height,
  padding,
  consumption,
  production,
  activeIndex,
  ticks = [],
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

  const toX = (date: Date) =>
    xDiff > 0
      ? padding.left + ((date.getTime() - xMin) / xDiff) * plotWidth
      : padding.left;
  const toY = (value: number) =>
    padding.top + (1 - value / maxValue) * plotHeight;

  const topBound = padding.top;
  const bottomBound = padding.top + plotHeight;

  const buildPath = (points: Point[]) => {
    const path = Skia.Path.Make();
    if (points.length === 0) {
      return path;
    }

    const coords = points.map((point) => ({
      x: toX(point.date),
      y: toY(point.value),
    }));

    path.moveTo(coords[0].x, coords[0].y);

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

      path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    return path;
  };

  return (
    <Canvas style={{ width, height }}>
      {ticks.map((tick) => (
        <Line
          key={`grid-${tick}`}
          p1={vec(padding.left, toY(tick))}
          p2={vec(width - padding.right, toY(tick))}
          color={gridColor}
          strokeWidth={1}
        />
      ))}

      <Path
        path={buildPath(production)}
        color={productionColor}
        style="stroke"
        strokeWidth={STROKE}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={buildPath(consumption)}
        color={consumptionColor}
        style="stroke"
        strokeWidth={STROKE}
        strokeCap="round"
        strokeJoin="round"
      />

      {consumption.map((point, index) => {
        const active = index === activeIndex;
        return (
          <Circle
            key={`c-${index}`}
            cx={toX(point.date)}
            cy={toY(point.value)}
            r={active ? DOT_RADIUS_ACTIVE : DOT_RADIUS}
            color={active ? consumptionColor : inactiveDotColor}
          />
        );
      })}

      {production.map((point, index) => {
        const active = index === activeIndex;
        return (
          <Circle
            key={`p-${index}`}
            cx={toX(point.date)}
            cy={toY(point.value)}
            r={active ? DOT_RADIUS_ACTIVE : DOT_RADIUS}
            color={active ? productionColor : inactiveDotColor}
          />
        );
      })}
    </Canvas>
  );
}
