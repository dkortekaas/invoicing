/**
 * Currency Formatting Utilities
 *
 * Provides currency-aware formatting for amounts and exchange rates.
 * Supports Dutch locale formatting and currency-specific rules.
 */

import { getCurrencyDecimals } from './decimals';

export interface FormatCurrencyOptions {
  /** The amount to format */
  amount: number;
  /** The ISO 4217 currency code (e.g., 'EUR', 'USD') */
  currencyCode: string;
  /** Locale for formatting (defaults to 'nl-NL') */
  locale?: string;
  /** Whether to show the currency symbol/code (defaults to true) */
  showSymbol?: boolean;
  /** Whether to use narrow symbol (e.g., '$' vs 'US$') */
  narrowSymbol?: boolean;
}

/**
 * Format an amount with currency symbol using Intl.NumberFormat.
 * Respects currency-specific decimal places (e.g., JPY = 0).
 */
export function formatCurrencyAmount(options: FormatCurrencyOptions): string {
  const {
    amount,
    currencyCode,
    locale = 'nl-NL',
    showSymbol = true,
    narrowSymbol = false,
  } = options;

  // Handle Decimal-like objects
  const numAmount = typeof amount === 'object' && amount !== null && 'toNumber' in amount
    ? (amount as { toNumber: () => number }).toNumber()
    : typeof amount === 'string'
      ? parseFloat(amount)
      : amount;

  if (!showSymbol) {
    // Format without currency symbol
    const decimals = getCurrencyDecimals(currencyCode);
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numAmount);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: narrowSymbol ? 'narrowSymbol' : 'symbol',
  }).format(numAmount);
}

/**
 * Format an exchange rate for display.
 * Shows 4-6 decimal places for precision.
 */
export function formatExchangeRate(rate: number, decimals: number = 4): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

/**
 * Format exchange rate as a conversion string.
 * Example: "1 EUR = 1,0823 USD"
 */
export function formatExchangeRateString(
  fromCode: string,
  toCode: string,
  rate: number
): string {
  return `1 ${fromCode} = ${formatExchangeRate(rate)} ${toCode}`;
}

/**
 * Format an amount with EUR equivalent for display.
 * Example: "$ 1.234,56 (EUR equivalent: € 1.140,23)"
 */
export function formatWithEurEquivalent(
  amount: number,
  currencyCode: string,
  eurAmount: number
): string {
  if (currencyCode === 'EUR') {
    return formatCurrencyAmount({ amount, currencyCode });
  }

  const formatted = formatCurrencyAmount({ amount, currencyCode });
  const eurFormatted = formatCurrencyAmount({ amount: eurAmount, currencyCode: 'EUR' });

  return `${formatted} (EUR equivalent: ${eurFormatted})`;
}

/**
 * Get currency symbol for a currency code.
 * Falls back to the code itself if symbol not available.
 */
export function getCurrencySymbol(currencyCode: string, locale: string = 'nl-NL'): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);

    const symbolPart = parts.find((part) => part.type === 'currency');
    return symbolPart?.value || currencyCode;
  } catch {
    return currencyCode;
  }
}

/**
 * Format currency code with symbol.
 * Example: "EUR (€)", "USD ($)"
 */
export function formatCurrencyWithSymbol(currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  if (symbol === currencyCode) {
    return currencyCode;
  }
  return `${currencyCode} (${symbol})`;
}

/**
 * Currency display info for UI components.
 */
export interface CurrencyDisplayInfo {
  code: string;
  symbol: string;
  name: string;
  nameDutch: string;
  decimalPlaces: number;
}

/**
 * Get currency display info from database or defaults.
 */
export function getCurrencyDisplayInfo(
  code: string,
  dbCurrency?: {
    symbol: string;
    name: string;
    nameDutch: string;
    decimalPlaces: number;
  }
): CurrencyDisplayInfo {
  const symbol = dbCurrency?.symbol || getCurrencySymbol(code);

  return {
    code,
    symbol,
    name: dbCurrency?.name || code,
    nameDutch: dbCurrency?.nameDutch || code,
    decimalPlaces: dbCurrency?.decimalPlaces ?? getCurrencyDecimals(code),
  };
}

/**
 * Format amount for PDF display with proper alignment.
 * Pads the amount string for right-alignment in PDF tables.
 */
export function formatAmountForPdf(
  amount: number,
  currencyCode: string,
  minWidth: number = 12
): string {
  const formatted = formatCurrencyAmount({ amount, currencyCode });
  return formatted.padStart(minWidth, ' ');
}

/**
 * Format date for exchange rate display in Dutch.
 */
export function formatRateDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format rate source name in Dutch.
 */
export function formatRateSource(source: 'ECB' | 'MANUAL'): string {
  const sources: Record<string, string> = {
    ECB: 'ECB',
    MANUAL: 'Handmatig',
  };
  return sources[source] || source;
}
