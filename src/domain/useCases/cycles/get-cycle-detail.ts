import { injectable } from 'tsyringe';

import { buildCycles, type Cycle } from '@/domain/entities/cycle';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class GetCycleDetailUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(id: string): Promise<Cycle | null> {
    const measurements = await this.repository.findAll();
    return buildCycles(measurements).find((cycle) => cycle.id === id) ?? null;
  }
}
