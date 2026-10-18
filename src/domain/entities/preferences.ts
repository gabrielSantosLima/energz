export type ThemePreference = 'system' | 'light' | 'dark';

export type Locale = 'en' | 'pt';

export interface Preferences {
  theme: ThemePreference;
  locale: Locale;
}
