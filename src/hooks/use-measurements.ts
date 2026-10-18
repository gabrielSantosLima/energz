import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Measurement, MeasurementInput } from '@/domain/entities/measurement';
import { CreateMeasurementUseCase } from '@/domain/useCases/measurements/create-measurement';
import { DeleteMeasurementUseCase } from '@/domain/useCases/measurements/delete-measurement';
import { GetMeasurementUseCase } from '@/domain/useCases/measurements/get-measurement';
import { ListMeasurementsUseCase } from '@/domain/useCases/measurements/list-measurements';
import {
  UpdateMeasurementUseCase,
  type UpdateMeasurementInput,
} from '@/domain/useCases/measurements/update-measurement';
import { useInjection } from '@/hooks/use-injection';

export function useMeasurements() {
  const list = useInjection(ListMeasurementsUseCase);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await list.execute();
      setMeasurements(result);
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

  return { measurements, loading, error, reload };
}

export function useMeasurementActions() {
  const create = useInjection(CreateMeasurementUseCase);
  const update = useInjection(UpdateMeasurementUseCase);
  const remove = useInjection(DeleteMeasurementUseCase);

  const createMeasurement = useCallback(
    (input: MeasurementInput) => create.execute(input),
    [create],
  );

  const updateMeasurement = useCallback(
    (input: UpdateMeasurementInput) => update.execute(input),
    [update],
  );

  const deleteMeasurement = useCallback(
    (id: string) => remove.execute(id),
    [remove],
  );

  return { createMeasurement, updateMeasurement, deleteMeasurement };
}

export function useMeasurement(id: string | undefined) {
  const get = useInjection(GetMeasurementUseCase);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!id) {
        setMeasurement(null);
        setLoading(false);
        return () => {
          active = false;
        };
      }

      setLoading(true);
      void get.execute(id).then((result) => {
        if (active) {
          setMeasurement(result);
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [get, id]),
  );

  return { measurement, loading };
}
