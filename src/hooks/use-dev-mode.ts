import { useDevStore } from '@/store/dev-store';

export function useDevMode() {
  const devMode = useDevStore((state) => state.devMode);
  const enableDevMode = useDevStore((state) => state.enableDevMode);
  const disableDevMode = useDevStore((state) => state.disableDevMode);

  return { devMode, enableDevMode, disableDevMode };
}
