import { injectable } from 'tsyringe';

import {
  buildDashboardSummary,
  type DashboardSummary,
} from '@/domain/entities/dashboard-summary';
import { MeasurementRepository } from '@/domain/services/measurement-repository';

@injectable()
export class GetDashboardSummaryUseCase {
  constructor(private readonly repository: MeasurementRepository) {}

  async execute(): Promise<DashboardSummary> {
    const measurements = await this.repository.findAll();
    return buildDashboardSummary(measurements);
  }
}
