import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme';

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
