import { injectable } from 'tsyringe';

import { buildCycles, type Cycle } from '@/domain/entities/cycle';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class ListCyclesUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(): Promise<Cycle[]> {
    const measurements = await this.repository.findAll();
    return buildCycles(measurements);
  }
}
