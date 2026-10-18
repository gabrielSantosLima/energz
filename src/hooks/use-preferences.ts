import { useCallback, useEffect } from 'react';

import type { Locale, ThemePreference } from '@/domain/entities/preferences';
import { GetPreferencesUseCase } from '@/domain/useCases/preferences/get-preferences';
import { SetLocaleUseCase } from '@/domain/useCases/preferences/set-locale';
import { SetThemePreferenceUseCase } from '@/domain/useCases/preferences/set-theme-preference';
import { useInjection } from '@/hooks/use-injection';
import { usePreferencesStore } from '@/store/preferences-store';

type UsePreferences = {
  theme: ThemePreference;
  locale: Locale;
  hydrated: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
};

export function usePreferences(): UsePreferences {
  const getPreferences = useInjection(GetPreferencesUseCase);
  const setThemeUseCase = useInjection(SetThemePreferenceUseCase);
  const setLocaleUseCase = useInjection(SetLocaleUseCase);

  const theme = usePreferencesStore((state) => state.theme);
  const locale = usePreferencesStore((state) => state.locale);
  const hydrated = usePreferencesStore((state) => state.hydrated);
  const applyTheme = usePreferencesStore((state) => state.setTheme);
  const applyLocale = usePreferencesStore((state) => state.setLocale);
  const setHydrated = usePreferencesStore((state) => state.setHydrated);

  useEffect(() => {
    let active = true;

    void getPreferences.execute().then((stored) => {
      if (!active) {
        return;
      }
      if (stored.theme) {
        applyTheme(stored.theme);
      }
      if (stored.locale) {
        applyLocale(stored.locale);
      }
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [getPreferences, applyTheme, applyLocale, setHydrated]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      applyTheme(next);
      void setThemeUseCase.execute(next);
    },
    [applyTheme, setThemeUseCase],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      applyLocale(next);
      void setLocaleUseCase.execute(next);
    },
    [applyLocale, setLocaleUseCase],
  );

  return { theme, locale, hydrated, setTheme, setLocale };
}
