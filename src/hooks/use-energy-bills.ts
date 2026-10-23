import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { EnergyBill } from '@/domain/entities/energy-bill';
import { DeleteEnergyBillUseCase } from '@/domain/useCases/bills/delete-energy-bill';
import { DeleteEnergyBillsUseCase } from '@/domain/useCases/bills/delete-energy-bills';
import { GetEnergyBillUseCase } from '@/domain/useCases/bills/get-energy-bill';
import { ListEnergyBillsUseCase } from '@/domain/useCases/bills/list-energy-bills';
import {
  SaveEnergyBillUseCase,
  type SaveEnergyBillInput,
} from '@/domain/useCases/bills/save-energy-bill';
import { UpdateEnergyBillUseCase } from '@/domain/useCases/bills/update-energy-bill';
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
  const update = useInjection(UpdateEnergyBillUseCase);
  const remove = useInjection(DeleteEnergyBillUseCase);
  const removeMany = useInjection(DeleteEnergyBillsUseCase);

  const saveEnergyBill = useCallback(
    (input: SaveEnergyBillInput) => save.execute(input),
    [save],
  );

  const updateEnergyBill = useCallback(
    (id: string, input: SaveEnergyBillInput) => update.execute(id, input),
    [update],
  );

  const deleteEnergyBill = useCallback(
    (id: string) => remove.execute(id),
    [remove],
  );

  const deleteEnergyBills = useCallback(
    (ids: string[]) => removeMany.execute(ids),
    [removeMany],
  );

  return {
    saveEnergyBill,
    updateEnergyBill,
    deleteEnergyBill,
    deleteEnergyBills,
  };
}

export function useEnergyBill(id: string | undefined) {
  const get = useInjection(GetEnergyBillUseCase);
  const [bill, setBill] = useState<EnergyBill | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!id) {
        setBill(null);
        setLoading(false);
        return () => {
          active = false;
        };
      }

      setLoading(true);
      void get.execute(id).then((result) => {
        if (active) {
          setBill(result);
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [get, id]),
  );

  return { bill, loading };
}
