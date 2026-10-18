import { create } from 'zustand';

import type { Locale, ThemePreference } from '@/domain/entities/preferences';
import { deviceLocale } from '@/lib/i18n';

type PreferencesState = {
  theme: ThemePreference;
  locale: Locale;
  hydrated: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'system',
  locale: deviceLocale(),
  hydrated: false,
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
