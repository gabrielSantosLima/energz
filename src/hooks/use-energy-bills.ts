import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { EnergyBill } from '@/domain/entities/energy-bill';
import { ListEnergyBillsUseCase } from '@/domain/useCases/bills/list-energy-bills';
import {
  SaveEnergyBillUseCase,
  type SaveEnergyBillInput,
} from '@/domain/useCases/bills/save-energy-bill';
import { useInjection } from '@/hooks/use-injection';

export function useEnergyBills() {
  const list = useInjection(ListEnergyBillsUseCase);
  const [bills, setBills] = useState<EnergyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await list.execute();
      setBills(result);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [list]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  return { bills, loading, refreshing, error, reload, refresh };
}

export function useEnergyBillActions() {
  const save = useInjection(SaveEnergyBillUseCase);

  const saveEnergyBill = useCallback(
    (input: SaveEnergyBillInput) => save.execute(input),
    [save],
  );

  return { saveEnergyBill };
}
