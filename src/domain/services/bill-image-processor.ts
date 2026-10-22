import * as FileSystem from 'expo-file-system/legacy';
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
  ): Promise<{ uri: string; base64: string; detected: boolean; result: ProcessBillResult }> {
    const result = await BillScanner.processBill({
      uri,
      crop,
      maxDimension: 2000,
      margin: 0.08,
      detect: true,
    });

    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { uri: result.uri, base64, detected: result.detected, result };
  }
}
