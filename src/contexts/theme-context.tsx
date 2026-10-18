import { createContext, useContext, type ReactNode } from 'react';

import type { Theme } from '@/theme';

export const ThemeOverrideContext = createContext<Theme | null>(null);

export function ThemeOverride({
  value,
  children,
}: {
  value: Theme;
  children: ReactNode;
}) {
  return (
    <ThemeOverrideContext.Provider value={value}>
      {children}
    </ThemeOverrideContext.Provider>
  );
}

export function useThemeOverride(): Theme | null {
  return useContext(ThemeOverrideContext);
}
