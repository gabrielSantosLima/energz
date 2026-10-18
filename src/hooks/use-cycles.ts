import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Cycle } from '@/domain/entities/cycle';
import { DeleteCyclesUseCase } from '@/domain/useCases/cycles/delete-cycles';
import { GetCycleDetailUseCase } from '@/domain/useCases/cycles/get-cycle-detail';
import { ListCyclesUseCase } from '@/domain/useCases/cycles/list-cycles';
import { useInjection } from '@/hooks/use-injection';

export function useCycles() {
  const list = useInjection(ListCyclesUseCase);
  const removeCycles = useInjection(DeleteCyclesUseCase);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await list.execute();
      setCycles(result);
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

  const deleteCycles = useCallback(
    async (ids: string[]) => {
      await removeCycles.execute(ids);
      await reload();
    },
    [removeCycles, reload],
  );

  return { cycles, loading, refreshing, error, refresh, deleteCycles };
}

export function useCycleDetail(id: string | undefined) {
  const get = useInjection(GetCycleDetailUseCase);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!id) {
        setCycle(null);
        setLoading(false);
        return () => {
          active = false;
        };
      }

      setLoading(true);
      void get.execute(id).then((result) => {
        if (active) {
          setCycle(result);
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [get, id]),
  );

  return { cycle, loading };
}
