import { injectable } from 'tsyringe';

import type { BillCharge, EnergyBill } from '@/domain/entities/energy-bill';
import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';
import { IdGenerator } from '@/domain/services/id-generator';

export type SaveEnergyBillInput = {
  distributor: string | null;
  readingDate: Date | null;
  amountCents: number | null;
  activeKwh: number | null;
  injectedKwh: number | null;
  charges: BillCharge[];
  flag: string | null;
};

export class IncompleteBillError extends Error {
  constructor() {
    super('Total, En Ativa and En Injetado are required.');
    this.name = 'IncompleteBillError';
  }
}

@injectable()
export class SaveEnergyBillUseCase {
  constructor(
    private readonly repository: EnergyBillRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: SaveEnergyBillInput): Promise<EnergyBill> {
    if (
      input.amountCents === null ||
      input.activeKwh === null ||
      input.injectedKwh === null
    ) {
      throw new IncompleteBillError();
    }

    const now = new Date();
    const bill: EnergyBill = {
      id: this.idGenerator.generate(),
      distributor: input.distributor,
      readingDate: input.readingDate,
      amountCents: input.amountCents,
      activeKwh: input.activeKwh,
      injectedKwh: input.injectedKwh,
      charges: input.charges,
      flag: input.flag,
      source: 'agent',
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.insert(bill);
    return bill;
  }
}
