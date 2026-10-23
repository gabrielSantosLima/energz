import { injectable } from 'tsyringe';

import type { EnergyBill } from '@/domain/entities/energy-bill';
import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';
import type { SaveEnergyBillInput } from '@/domain/useCases/bills/save-energy-bill';

export class EnergyBillNotFoundError extends Error {
  constructor() {
    super('Energy bill not found.');
    this.name = 'EnergyBillNotFoundError';
  }
}

@injectable()
export class UpdateEnergyBillUseCase {
  constructor(private readonly repository: EnergyBillRepository) {}

  async execute(id: string, input: SaveEnergyBillInput): Promise<EnergyBill> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new EnergyBillNotFoundError();
    }

    const bill: EnergyBill = {
      ...current,
      distributor: input.distributor,
      readingDate: input.readingDate,
      amountCents: input.amountCents ?? current.amountCents,
      activeKwh: input.activeKwh ?? current.activeKwh,
      injectedKwh: input.injectedKwh ?? current.injectedKwh,
      charges: input.charges,
      flag: input.flag,
      updatedAt: new Date(),
    };

    await this.repository.update(bill);
    return bill;
  }
}
