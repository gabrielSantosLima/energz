import { injectable } from 'tsyringe';

import {
  buildBillReport,
  type BillReport,
} from '@/domain/entities/bill-report';
import { ListEnergyBillsUseCase } from '@/domain/useCases/bills/list-energy-bills';

@injectable()
export class GenerateBillReportUseCase {
  constructor(private readonly listBills: ListEnergyBillsUseCase) {}

  async execute(): Promise<BillReport> {
    return buildBillReport(await this.listBills.execute());
  }
}
