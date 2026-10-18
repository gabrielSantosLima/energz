import { injectable } from 'tsyringe';

import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class DeleteMeasurementsUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.repository.delete(id);
    }
  }
}
