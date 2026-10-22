import { NativeModule, requireNativeModule } from 'expo';

import type { ProcessBillOptions, ProcessBillResult } from './BillScanner.types';

declare class BillScannerModule extends NativeModule {
  processBill(options: ProcessBillOptions): Promise<ProcessBillResult>;
}

export default requireNativeModule<BillScannerModule>('BillScanner');
