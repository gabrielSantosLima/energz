import type { RecordOrigin } from './record-origin';

export interface Measurement {
  id: string;
  measuredAt: Date;
  consumption: number;
  production: number;
  endsCycle: boolean;
  restart: boolean;
  createdAt: Date;
  updatedAt: Date;
  origin: RecordOrigin | null;
}

export type MeasurementInput = {
  measuredAt: Date;
  consumption: number;
  production: number;
  endsCycle: boolean;
  restart: boolean;
};

export interface MeasurementInterval {
  from: Measurement;
  to: Measurement;
  consumption: number;
  production: number;
}

export function sortMeasurements(measurements: Measurement[]): Measurement[] {
  return [...measurements].sort(
    (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
  );
}

export function computeInterval(
  from: Measurement,
  to: Measurement,
): MeasurementInterval {
  const consumption = to.restart
    ? Math.max(0, to.consumption)
    : Math.max(0, to.consumption - from.consumption);
  const production = to.restart
    ? Math.max(0, to.production)
    : Math.max(0, to.production - from.production);

  return { from, to, consumption, production };
}

export function buildIntervals(sorted: Measurement[]): MeasurementInterval[] {
  const intervals: MeasurementInterval[] = [];

  for (let index = 1; index < sorted.length; index += 1) {
    intervals.push(computeInterval(sorted[index - 1], sorted[index]));
  }

  return intervals;
}
