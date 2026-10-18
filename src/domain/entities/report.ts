import type { Cycle } from './cycle';
import { sortMeasurements, type Measurement } from './measurement';

export interface Report {
  cycle: Cycle;
  measurements: Measurement[];
}

export function buildReport(
  cycle: Cycle,
  measurements: Measurement[],
): Report {
  const inCycle = sortMeasurements(measurements).filter(
    (measurement) =>
      measurement.measuredAt.getTime() >= cycle.start.measuredAt.getTime() &&
      measurement.measuredAt.getTime() <= cycle.end.measuredAt.getTime(),
  );

  return { cycle, measurements: inCycle };
}
