import { findCurrentCycle, type Cycle } from './cycle';
import { buildIntervals, sortMeasurements, type Measurement } from './measurement';

export interface MetricSummary {
  value: number;
  previousValue: number | null;
  trend: number | null;
}

export interface DashboardSummary {
  hasData: boolean;
  measurementCount: number;
  consumption: MetricSummary;
  production: MetricSummary;
  currentCycle: Cycle | null;
}

export function buildDashboardSummary(
  measurements: Measurement[],
): DashboardSummary {
  const sorted = sortMeasurements(measurements);
  const intervals = buildIntervals(sorted);

  const latest = intervals[intervals.length - 1] ?? null;
  const previous = intervals[intervals.length - 2] ?? null;

  const consumption: MetricSummary = {
    value: latest?.consumption ?? 0,
    previousValue: previous?.consumption ?? null,
    trend:
      latest && previous ? latest.consumption - previous.consumption : null,
  };

  const production: MetricSummary = {
    value: latest?.production ?? 0,
    previousValue: previous?.production ?? null,
    trend: latest && previous ? latest.production - previous.production : null,
  };

  return {
    hasData: sorted.length > 0,
    measurementCount: sorted.length,
    consumption,
    production,
    currentCycle: findCurrentCycle(sorted),
  };
}
