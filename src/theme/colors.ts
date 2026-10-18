export const palette = {
  navy: '#060915',
  blue: '#0A6BFE',
  blueLight: '#0982FC',
  solar: '#FEB317',
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSelected: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  onPrimary: string;
  primaryPressed: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

export const lightColors: ThemeColors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  surfaceSelected: '#E3E8EF',
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  textPrimary: '#0B0F19',
  textSecondary: '#5A6172',
  textTertiary: '#8A909E',
  primary: '#0A6BFE',
  onPrimary: '#FFFFFF',
  primaryPressed: '#0857D6',
  primarySoft: '#E7F0FF',
  accent: '#FEB317',
  accentSoft: '#FFF4DC',
  success: '#16A34A',
  warning: '#E08700',
  danger: '#E5484D',
  info: '#0A6BFE',
};

export const darkColors: ThemeColors = {
  background: '#060915',
  surface: '#101728',
  surfaceMuted: '#0C1220',
  surfaceSelected: '#172033',
  border: '#1D2740',
  borderStrong: '#2A3654',
  textPrimary: '#F5F7FA',
  textSecondary: '#A6ADBD',
  textTertiary: '#6C7488',
  primary: '#3B8BFF',
  onPrimary: '#04122B',
  primaryPressed: '#2E76E0',
  primarySoft: '#12233F',
  accent: '#FEB317',
  accentSoft: '#2A2410',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#3B8BFF',
};

export const dataViz = {
  production: ['#FEB317', '#FF8A00'],
  consumption: ['#0A6BFE', '#0982FC'],
  netPositive: '#16A34A',
  netNegative: '#E5484D',
} as const;
