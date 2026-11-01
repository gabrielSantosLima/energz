import { create } from 'zustand';

export type BillScanResult = {
  originalUri: string | null;
  processedUri: string | null;
  rawText: string;
  /** Processed image uri that already went through OCR + AI parsing. */
  parsedUri: string | null;
  processMs: number | null;
  ocrMs: number | null;
  detected: boolean | null;
  error: string | null;
};

const initialScan: BillScanResult = {
  originalUri: null,
  processedUri: null,
  rawText: '',
  parsedUri: null,
  processMs: null,
  ocrMs: null,
  detected: null,
  error: null,
};

type BillScanState = {
  scan: BillScanResult;
  setScan: (patch: Partial<BillScanResult>) => void;
  resetScan: () => void;
};

export const useBillScanStore = create<BillScanState>((set) => ({
  scan: initialScan,
  setScan: (patch) => set((state) => ({ scan: { ...state.scan, ...patch } })),
  resetScan: () => set({ scan: initialScan }),
}));
