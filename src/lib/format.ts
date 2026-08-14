/**
 * Formatting helpers shared by the server and the client.
 *
 * Prices live in the content files as whole USD units. Everything a visitor
 * sees passes through here so the currency switcher, the booking summary and
 * the structured data can never drift apart.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'ZAR' | 'JPY';

export type Currency = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Multiplier applied to the USD base price. */
  rate: number;
  /** Currencies without minor units must not render decimals. */
  decimals: number;
};

/**
 * Static rates, refreshed at deploy time.
 *
 * Live FX would mean a request on every price render and a number that changes
 * between the quote and the invoice; a studio quotes in its own currency and
 * converts at payment, so an indicative rate is the honest thing to show. The
 * UI labels converted prices as approximate for exactly this reason.
 */
export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', label: 'US Dollar', symbol: '$', rate: 1, decimals: 0 },
  EUR: { code: 'EUR', label: 'Euro', symbol: '€', rate: 0.92, decimals: 0 },
  GBP: { code: 'GBP', label: 'British Pound', symbol: '£', rate: 0.79, decimals: 0 },
  NGN: { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', rate: 1580, decimals: 0 },
  ZAR: { code: 'ZAR', label: 'South African Rand', symbol: 'R', rate: 18.4, decimals: 0 },
  JPY: { code: 'JPY', label: 'Japanese Yen', symbol: '¥', rate: 157, decimals: 0 },
};

/** Converts a USD base price and formats it for the given currency. */
export function formatMoney(usd: number, code: CurrencyCode = 'USD'): string {
  const currency = CURRENCIES[code];
  const amount = usd * currency.rate;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
}

/** "$180/hr" style label used across service and room cards. */
export function formatRate(usd: number, unit: string, code: CurrencyCode = 'USD'): string {
  return `${formatMoney(usd, code)}/${unit}`;
}

/** 90 -> "1h 30m", 60 -> "1h", 45 -> "45m". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * A calendar date as YYYY-MM-DD in local time.
 *
 * `toISOString()` would convert to UTC first, which puts anyone west of
 * Greenwich on the previous day for most of the evening — an off-by-one that
 * shows up as bookings landing on the wrong date.
 */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a YYYY-MM-DD key back into a local-midnight Date. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function formatDate(date: Date | string, locale = 'en-US'): string {
  const value = typeof date === 'string' ? fromDateKey(date) : date;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

export function formatDateShort(date: Date | string, locale = 'en-US'): string {
  const value = typeof date === 'string' ? fromDateKey(date) : date;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    value,
  );
}

/** "14:00" -> "2:00 PM". */
export function formatTime(time: string, locale = 'en-US'): string {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hour ?? 0, minute ?? 0);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
}

/** Seconds -> "3:07", for the player transport. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
