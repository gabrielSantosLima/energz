import { useCallback } from 'react';
import type { TranslateOptions } from 'i18n-js';

import type { Locale } from '@/domain/entities/preferences';
import { translate } from '@/lib/i18n';
import { usePreferencesStore } from '@/store/preferences-store';

export function useTranslation(): {
  t: (key: string, options?: TranslateOptions) => string;
  locale: Locale;
} {
  const locale = usePreferencesStore((state) => state.locale);

  const t = useCallback(
    (key: string, options?: TranslateOptions) => translate(locale, key, options),
    [locale],
  );

  return { t, locale };
}
