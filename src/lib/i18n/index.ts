import { getLocales } from 'expo-localization';
import { I18n, type TranslateOptions } from 'i18n-js';

import type { Locale } from '@/domain/entities/preferences';
import { en } from './locales/en';
import { pt } from './locales/pt';

export const locales: Locale[] = ['en', 'pt'];

export const i18n = new I18n({ en, pt });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === 'pt' ? 'pt' : 'en';
}

export function translate(
  locale: Locale,
  key: string,
  options?: TranslateOptions,
): string {
  i18n.locale = locale;
  return i18n.t(key, options) as string;
}
