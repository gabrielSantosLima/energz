import type { ViewStyle } from 'react-native';

import { darkColors } from './colors';

const light: Record<string, ViewStyle> = {
  elevation0: {},
  elevation1: {
    shadowColor: '#060915',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  elevation2: {
    shadowColor: '#060915',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

const dark: Record<string, ViewStyle> = {
  elevation0: {},
  elevation1: {
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  elevation2: {
    borderWidth: 1,
    borderColor: darkColors.borderStrong,
  },
};

export const elevation = { light, dark } as const;

export type ElevationToken = keyof typeof light;
