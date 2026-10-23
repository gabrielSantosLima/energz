import { create } from 'zustand';

export type BillScanResult = {
  originalUri: string | null;
  processedUri: string | null;
  rawText: string;
  processMs: number | null;
  ocrMs: number | null;
  detected: boolean | null;
  error: string | null;
};

const initialScan: BillScanResult = {
  originalUri: null,
  processedUri: null,
  rawText: '',
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
