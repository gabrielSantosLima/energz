import { injectable } from 'tsyringe';

import type { EnergyBill } from '@/domain/entities/energy-bill';
import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';

@injectable()
export class ListEnergyBillsUseCase {
  constructor(private readonly repository: EnergyBillRepository) {}

  async execute(): Promise<EnergyBill[]> {
    return this.repository.findAll();
  }
}
