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

const shortMonths: Record<Locale, string[]> = {
  en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
};

export function formatShortDate(date: Date, locale: Locale): string {
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${day}/${shortMonths[locale][date.getMonth()]}`;
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

export function formatCurrency(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
