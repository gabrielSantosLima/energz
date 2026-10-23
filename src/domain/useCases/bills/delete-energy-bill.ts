import { injectable } from 'tsyringe';

import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';

@injectable()
export class DeleteEnergyBillUseCase {
  constructor(private readonly repository: EnergyBillRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
