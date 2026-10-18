import { sortMeasurements, type Measurement } from './measurement';

export interface Cycle {
  id: string;
  start: Measurement;
  end: Measurement;
  consumption: number;
  production: number;
  balance: number;
  closed: boolean;
}

function createCycle(
  start: Measurement,
  end: Measurement,
  closed: boolean,
): Cycle {
  const consumption = Math.max(0, end.consumption - start.consumption);
  const production = Math.max(0, end.production - start.production);

  return {
    id: closed ? end.id : `open:${end.id}`,
    start,
    end,
    consumption,
    production,
    balance: production - consumption,
    closed,
  };
}

export function buildCycles(measurements: Measurement[]): Cycle[] {
  const sorted = sortMeasurements(measurements);
  if (sorted.length === 0) {
    return [];
  }

  const cycles: Cycle[] = [];
  let boundary = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].endsCycle) {
      cycles.push(createCycle(sorted[boundary], sorted[index], true));
      boundary = index;
    }
  }

  const last = sorted[sorted.length - 1];
  const lastClosedAtEnd = last.endsCycle && boundary === sorted.length - 1;

  if (!lastClosedAtEnd) {
    cycles.push(createCycle(sorted[boundary], last, false));
  }

  return cycles;
}

export function findCurrentCycle(measurements: Measurement[]): Cycle | null {
  const cycles = buildCycles(measurements);
  return cycles.find((cycle) => !cycle.closed) ?? null;
}
