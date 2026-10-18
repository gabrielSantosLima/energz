import { injectable } from 'tsyringe';

import type { Measurement } from '@/domain/entities/measurement';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class ListMeasurementsUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(): Promise<Measurement[]> {
    return this.repository.findAll();
  }
}
