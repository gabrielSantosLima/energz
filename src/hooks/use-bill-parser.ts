import { useCallback } from 'react';

import {
  ParseEnergyBillUseCase,
  type ParseEnergyBillResult,
} from '@/domain/useCases/agents/parse-energy-bill';
import { useInjection } from '@/hooks/use-injection';
import { useBillDraftStore } from '@/store/bill-draft-store';

type UseBillParser = {
  parse: (ocrText: string) => Promise<ParseEnergyBillResult | null>;
};

export function useBillParser(): UseBillParser {
  const parseEnergyBill = useInjection(ParseEnergyBillUseCase);
  const setDraft = useBillDraftStore((state) => state.setDraft);
  const setParseError = useBillDraftStore((state) => state.setParseError);

  const parse = useCallback(
    async (ocrText: string) => {
      try {
        const result = await parseEnergyBill.execute(ocrText);
        setDraft(result.draft);
        setParseError(null);
        return result;
      } catch (error) {
        setDraft(null);
        setParseError(error instanceof Error ? error.message : String(error));
        return null;
      }
    },
    [parseEnergyBill, setDraft, setParseError],
  );

  return { parse };
}
