import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mock data for the quick measurement prototypes. Nothing here is persisted:
 * the value is only used to simulate the "last reading" scenario.
 */
export const PROTOTYPE_LAST_READING = {
  consumption: 25110,
  production: 17433,
} as const;

const SAVE_DELAY_MS = 700;

export type QuickMeasurePhase = 'idle' | 'saving' | 'saved';

export function useQuickMeasureMock() {
  const [consumption, setConsumption] = useState<number>(
    PROTOTYPE_LAST_READING.consumption,
  );
  const [production, setProduction] = useState<number>(
    PROTOTYPE_LAST_READING.production,
  );
  const [phase, setPhase] = useState<QuickMeasurePhase>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const consumptionDelta = consumption - PROTOTYPE_LAST_READING.consumption;
  const productionDelta = production - PROTOTYPE_LAST_READING.production;
  const valid =
    consumption >= PROTOTYPE_LAST_READING.consumption &&
    production >= PROTOTYPE_LAST_READING.production;

  const save = useCallback(() => {
    if (phase === 'saving') {
      return;
    }

    setPhase('saving');
    timer.current = setTimeout(() => {
      timer.current = null;
      setSavedAt(new Date());
      setPhase('saved');
    }, SAVE_DELAY_MS);
  }, [phase]);

  const undo = useCallback(() => {
    setSavedAt(null);
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    setConsumption(PROTOTYPE_LAST_READING.consumption);
    setProduction(PROTOTYPE_LAST_READING.production);
    setSavedAt(null);
    setPhase('idle');
  }, []);

  return {
    last: PROTOTYPE_LAST_READING,
    consumption,
    production,
    consumptionDelta,
    productionDelta,
    phase,
    savedAt,
    valid,
    setConsumption,
    setProduction,
    save,
    undo,
    reset,
  };
}
