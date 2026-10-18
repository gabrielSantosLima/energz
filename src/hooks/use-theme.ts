import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme';
import { usePreferencesStore } from '@/store/preferences-store';

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
};

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((state) => state.theme);

  const isDark =
    preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
