import { injectable } from 'tsyringe';

import { buildCycles } from '@/domain/entities/cycle';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class DeleteCyclesUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(cycleIds: string[]): Promise<void> {
    const measurements = await this.repository.findAll();
    const cycles = buildCycles(measurements);
    const ids = new Set<string>();

    for (const cycleId of cycleIds) {
      const cycle = cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        continue;
      }

      const start = cycle.start.measuredAt.getTime();
      const end = cycle.end.measuredAt.getTime();

      for (const measurement of measurements) {
        const time = measurement.measuredAt.getTime();
        if (time >= start && time <= end) {
          ids.add(measurement.id);
        }
      }
    }

    for (const id of ids) {
      await this.repository.delete(id);
    }
  }
}
