import type { Locale } from '@/domain/entities/preferences';

const intlLocale: Record<Locale, string> = {
  en: 'en-US',
  pt: 'pt-BR',
};

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(
  value: number,
  locale: Locale,
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    maximumFractionDigits,
  }).format(value);
}

export function formatEnergy(value: number, locale: Locale): string {
  return `${formatNumber(value, locale)} kWh`;
}
