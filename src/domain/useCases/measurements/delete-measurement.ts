import { injectable } from 'tsyringe';

import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class DeleteMeasurementUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
