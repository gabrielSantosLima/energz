import { buildCycleSeries, type SeriesPoint } from '@/domain/entities/cycle';
import type { Locale } from '@/domain/entities/preferences';
import type { Report } from '@/domain/entities/report';
import { formatDate, formatEnergy, formatNumber, formatShortDate } from './format';

export type ReportLabels = {
  title: string;
  period: string;
  production: string;
  consumption: string;
  balance: string;
  date: string;
  measurements: string;
};

const SVG_WIDTH = 640;
const SVG_HEIGHT = 260;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

type Projection = {
  toX: (date: Date) => number;
  toY: (value: number) => number;
  maxValue: number;
  first: Date;
  last: Date;
};

function buildProjection(series: SeriesPoint[]): Projection {
  const last = series.length - 1;
  const xMin = series[0]?.date.getTime() ?? 0;
  const xMax = series[last]?.date.getTime() ?? 0;
  const xDiff = xMax - xMin;
  const maxValue = Math.max(1, ...series.map((point) => point.value));

  const plotWidth = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  return {
    maxValue,
    first: series[0]?.date ?? new Date(),
    last: series[last]?.date ?? new Date(),
    toX: (date) =>
      xDiff > 0
        ? PAD_LEFT + ((date.getTime() - xMin) / xDiff) * plotWidth
        : PAD_LEFT,
    toY: (value) =>
      SVG_HEIGHT - PAD_BOTTOM - (value / maxValue) * plotHeight,
  };
}

function smoothPath(
  points: SeriesPoint[],
  { toX, toY }: Projection,
  topBound: number,
  bottomBound: number,
): string {
  if (points.length === 0) {
    return '';
  }

  const clamp = (value: number) =>
    Math.min(Math.max(value, topBound), bottomBound);

  const coords = points.map((point) => ({
    x: toX(point.date),
    y: toY(point.value),
  }));

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let index = 0; index < coords.length - 1; index += 1) {
    const p0 = coords[index - 1] ?? coords[index];
    const p1 = coords[index];
    const p2 = coords[index + 1];
    const p3 = coords[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clamp(p2.y - (p3.y - p1.y) / 6);

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

function dots(
  points: SeriesPoint[],
  color: string,
  { toX, toY }: Projection,
): string {
  return points
    .map((point, index) => {
      const active = index === points.length - 1;
      const r = active ? 5 : 3;
      return `<circle cx="${toX(point.date).toFixed(1)}" cy="${toY(point.value).toFixed(1)}" r="${r}" fill="${active ? color : '#8A909E'}" stroke="#FFFFFF" stroke-width="2" />`;
    })
    .join('');
}

function buildChartSvg(
  consumption: SeriesPoint[],
  production: SeriesPoint[],
  labels: ReportLabels,
  locale: Locale,
): string {
  const projection = buildProjection(consumption);
  const { toY, maxValue, first, last } = projection;

  const ticks = [maxValue, maxValue / 2, 0];

  const grid = ticks
    .map(
      (value) =>
        `<line x1="${PAD_LEFT}" y1="${toY(value).toFixed(1)}" x2="${SVG_WIDTH - PAD_RIGHT}" y2="${toY(value).toFixed(1)}" stroke="#E4E7EC" stroke-width="1" />`,
    )
    .join('');

  const yLabels = ticks
    .map(
      (value) =>
        `<text x="${PAD_LEFT - 8}" y="${(toY(value) + 4).toFixed(1)}" fill="#8A909E" font-size="11" text-anchor="end">${formatNumber(value, locale)}</text>`,
    )
    .join('');

  const xLabels = `<text x="${PAD_LEFT}" y="${SVG_HEIGHT - 8}" fill="#8A909E" font-size="11" text-anchor="start">${formatShortDate(first, locale)}</text>
    <text x="${SVG_WIDTH - PAD_RIGHT}" y="${SVG_HEIGHT - 8}" fill="#8A909E" font-size="11" text-anchor="end">${formatShortDate(last, locale)}</text>`;

  const topBound = PAD_TOP;
  const bottomBound = SVG_HEIGHT - PAD_BOTTOM;
  const consumptionLine = smoothPath(consumption, projection, topBound, bottomBound);
  const productionLine = smoothPath(production, projection, topBound, bottomBound);

  return `
    <div class="legend">
      <span class="legend-item"><i style="background:#0A6BFE"></i>${labels.consumption}</span>
      <span class="legend-item"><i style="background:#FEB317"></i>${labels.production}</span>
      <span class="legend-item axis-unit">kWh</span>
    </div>
    <svg class="chart" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      ${yLabels}
      ${xLabels}
      <path d="${productionLine}" fill="none" stroke="#FEB317" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${consumptionLine}" fill="none" stroke="#0A6BFE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${dots(consumption, '#0A6BFE', projection)}
      ${dots(production, '#FEB317', projection)}
    </svg>`;
}

export function buildReportHtml(
  report: Report,
  labels: ReportLabels,
  locale: Locale,
): string {
  const { cycle } = report;
  const series = buildCycleSeries(cycle, report.measurements);

  const period = `${formatDate(cycle.start.measuredAt, locale)} - ${formatDate(cycle.end.measuredAt, locale)}`;

  const summary: [string, string][] = [
    [labels.production, formatEnergy(cycle.production, locale)],
    [labels.consumption, formatEnergy(cycle.consumption, locale)],
    [labels.balance, formatEnergy(cycle.balance, locale)],
  ];

  const summaryHtml = summary
    .map(
      ([label, value]) =>
        `<div class="row"><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join('');

  const chartHtml =
    series.consumption.length >= 2
      ? buildChartSvg(series.consumption, series.production, labels, locale)
      : '';

  const rows = report.measurements
    .map(
      (measurement) =>
        `<tr><td>${formatDate(measurement.measuredAt, locale)}</td><td>${formatEnergy(
          measurement.consumption,
          locale,
        )}</td><td>${formatEnergy(measurement.production, locale)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Roboto, sans-serif; color: #0B0F19; padding: 24px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .period { color: #5A6172; margin: 0 0 16px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E4E7EC; }
      .row span { color: #5A6172; }
      .legend { margin: 20px 0 8px; }
      .legend-item { display: inline-flex; align-items: center; font-size: 12px; color: #5A6172; margin-right: 16px; }
      .legend-item i { display: inline-block; width: 8px; height: 8px; border-radius: 4px; margin-right: 6px; }
      .axis-unit { margin-left: auto; }
      svg.chart { display: block; width: 100%; height: auto; }
      h2 { font-size: 15px; margin: 24px 0 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #E4E7EC; font-size: 13px; }
      th { color: #5A6172; font-weight: 600; }
    </style>
  </head>
  <body>
    <h1>${labels.title}</h1>
    <p class="period">${labels.period}: ${period}</p>
    ${summaryHtml}
    ${chartHtml}
    <h2>${labels.measurements}</h2>
    <table>
      <thead>
        <tr><th>${labels.date}</th><th>${labels.consumption}</th><th>${labels.production}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}
