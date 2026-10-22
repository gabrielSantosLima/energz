import { injectable } from 'tsyringe';

import type { Measurement, MeasurementInput } from '@/domain/entities/measurement';
import { IdGenerator } from '@/domain/services/id-generator';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class CreateMeasurementUseCase {
  constructor(
    private readonly repository: MeasurementRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: MeasurementInput): Promise<Measurement> {
    const now = new Date();
    const measurement: Measurement = {
      id: this.idGenerator.generate(),
      measuredAt: input.measuredAt,
      consumption: input.consumption,
      production: input.production,
      endsCycle: input.endsCycle,
      restart: input.restart,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.insert(measurement);
    return measurement;
  }
}
