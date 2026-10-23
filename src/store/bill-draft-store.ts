import { create } from 'zustand';

import type { BillDraft } from '@/domain/entities/energy-bill';

type BillDraftState = {
  draft: BillDraft | null;
  parseError: string | null;
  setDraft: (draft: BillDraft | null) => void;
  setParseError: (error: string | null) => void;
  resetDraft: () => void;
};

export const useBillDraftStore = create<BillDraftState>((set) => ({
  draft: null,
  parseError: null,
  setDraft: (draft) => set({ draft }),
  setParseError: (parseError) => set({ parseError }),
  resetDraft: () => set({ draft: null, parseError: null }),
}));
