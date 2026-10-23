import { NativeModule, requireNativeModule } from 'expo';

import type { ProcessBillOptions, ProcessBillResult } from './BillScanner.types';

declare class BillScannerModule extends NativeModule {
  processBill(options: ProcessBillOptions): Promise<ProcessBillResult>;
  recognizeText(uri: string): Promise<string>;
  scanDocument(): Promise<{ uri: string; pageCount: number }>;
}

export default requireNativeModule<BillScannerModule>('BillScanner');
