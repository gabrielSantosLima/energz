import { useMemo } from 'react';

import { container } from '@/contexts/container';

type Constructor<T> = new (...args: any[]) => T;

export function useInjection<T>(token: Constructor<T>): T {
  return useMemo(() => container.resolve<T>(token), [token]);
}
