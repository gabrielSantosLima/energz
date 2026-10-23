import { injectable } from 'tsyringe';

import BillScanner, {
  type BillCropRect,
  type ProcessBillResult,
} from '../../../modules/bill-scanner';

@injectable()
export class BillImageProcessor {
  async enhance(
    uri: string,
    crop: BillCropRect,
    detect = true,
  ): Promise<{ uri: string; detected: boolean; result: ProcessBillResult }> {
    const result = await BillScanner.processBill({
      uri,
      crop,
      maxDimension: 2000,
      margin: 0.08,
      detect,
    });

    return { uri: result.uri, detected: result.detected, result };
  }

  async recognizeText(uri: string): Promise<string> {
    return BillScanner.recognizeText(uri);
  }

  async scanDocument(): Promise<{ uri: string; pageCount: number }> {
    return BillScanner.scanDocument();
  }
}
