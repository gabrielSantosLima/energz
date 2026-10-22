import { create } from 'zustand';

export type ScanDebug = {
  originalUri: string | null;
  processedUri: string | null;
  rawText: string;
  processMs: number | null;
  ocrMs: number | null;
  detected: boolean | null;
  error: string | null;
};

const initialScan: ScanDebug = {
  originalUri: null,
  processedUri: null,
  rawText: '',
  processMs: null,
  ocrMs: null,
  detected: null,
  error: null,
};

type DevState = {
  devMode: boolean;
  scan: ScanDebug;
  enableDevMode: () => void;
  disableDevMode: () => void;
  setScan: (patch: Partial<ScanDebug>) => void;
  resetScan: () => void;
};

export const useDevStore = create<DevState>((set) => ({
  devMode: false,
  scan: initialScan,
  enableDevMode: () => set({ devMode: true }),
  disableDevMode: () => set({ devMode: false }),
  setScan: (patch) => set((state) => ({ scan: { ...state.scan, ...patch } })),
  resetScan: () => set({ scan: initialScan }),
}));
