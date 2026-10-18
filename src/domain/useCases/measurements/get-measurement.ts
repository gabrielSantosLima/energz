import { injectable } from 'tsyringe';

import type { Measurement } from '@/domain/entities/measurement';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class GetMeasurementUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(id: string): Promise<Measurement | null> {
    return this.repository.findById(id);
  }
}
