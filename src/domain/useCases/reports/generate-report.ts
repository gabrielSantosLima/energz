import { injectable } from 'tsyringe';

import { buildCycles } from '@/domain/entities/cycle';
import { buildReport, type Report } from '@/domain/entities/report';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class GenerateReportUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(cycleId?: string): Promise<Report | null> {
    const measurements = await this.repository.findAll();
    const cycles = buildCycles(measurements);

    const cycle = cycleId
      ? (cycles.find((item) => item.id === cycleId) ?? null)
      : (cycles.find((item) => !item.closed) ??
        cycles[cycles.length - 1] ??
        null);

    if (!cycle) {
      return null;
    }

    return buildReport(cycle, measurements);
  }
}
