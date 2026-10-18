import { injectable } from 'tsyringe';

import type { Measurement, MeasurementInput } from '@/domain/entities/measurement';
import { MeasurementNotFoundError } from '@/domain/errors/measurement-not-found-error';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

export type UpdateMeasurementInput = Partial<MeasurementInput> & { id: string };

@injectable()
export class UpdateMeasurementUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(input: UpdateMeasurementInput): Promise<Measurement> {
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new MeasurementNotFoundError(input.id);
    }

    const updated: Measurement = {
      ...existing,
      measuredAt: input.measuredAt ?? existing.measuredAt,
      consumption: input.consumption ?? existing.consumption,
      production: input.production ?? existing.production,
      endsCycle: input.endsCycle ?? existing.endsCycle,
      updatedAt: new Date(),
    };

    await this.repository.update(updated);
    return updated;
  }
}
