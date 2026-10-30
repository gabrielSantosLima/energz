import { injectable } from 'tsyringe';

import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class DeleteMeasurementsUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(ids: string[]): Promise<void> {
    await this.repository.deleteMany(ids);
  }
}
