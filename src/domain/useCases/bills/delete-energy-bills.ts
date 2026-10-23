import { injectable } from 'tsyringe';

import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';

@injectable()
export class DeleteEnergyBillsUseCase {
  constructor(private readonly repository: EnergyBillRepository) {}

  async execute(ids: string[]): Promise<void> {
    await this.repository.deleteMany(ids);
  }
}
