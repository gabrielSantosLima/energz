import { useColorScheme } from 'react-native';

import { useThemeOverride } from '@/contexts/theme-context';
import { usePreferencesStore } from '@/store/preferences-store';
import { darkColors, lightColors, type Theme } from '@/theme';

export type { Theme };

export function useTheme(): Theme {
  const override = useThemeOverride();
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((state) => state.theme);

  if (override) {
    return override;
  }

  const isDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
