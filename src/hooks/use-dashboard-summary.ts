import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { DashboardSummary } from '@/domain/entities/dashboard-summary';
import { GetDashboardSummaryUseCase } from '@/domain/useCases/dashboard/get-dashboard-summary';
import { useInjection } from '@/hooks/use-injection';

export function useDashboardSummary() {
  const getSummary = useInjection(GetDashboardSummaryUseCase);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      void getSummary.execute().then((result) => {
        if (active) {
          setSummary(result);
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [getSummary]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getSummary.execute();
      setSummary(result);
    } finally {
      setRefreshing(false);
    }
  }, [getSummary]);

  return { summary, loading, refreshing, refresh };
}
