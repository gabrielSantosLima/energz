import { injectable } from 'tsyringe';

import type { EnergyBill } from '@/domain/entities/energy-bill';
import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';

@injectable()
export class GetEnergyBillUseCase {
  constructor(private readonly repository: EnergyBillRepository) {}

  async execute(id: string): Promise<EnergyBill | null> {
    return this.repository.findById(id);
  }
}
