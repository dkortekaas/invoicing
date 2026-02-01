/**
 * Currency Conversion Utilities
 *
 * Provides amount conversion between currencies, decimal handling,
 * and rounding based on currency-specific rules (e.g., JPY has 0 decimals).
 */

import { db } from '@/lib/db';
import { getCurrencyDecimals } from './decimals';

export { getCurrencyDecimals } from './decimals';

/**
 * Get currency decimals from database, falling back to static config.
 */
export async function getCurrencyDecimalsFromDb(code: string): Promise<number> {
  const currency = await db.currency.findUnique({
    where: { code },
    select: { decimalPlaces: true },
  });

  if (currency) {
    return currency.decimalPlaces;
  }

  return getCurrencyDecimals(code);
}

/**
 * Round a value to the specified number of decimal places.
 * Uses banker's rounding (round half to even) for financial accuracy.
 */
export function roundToDecimals(value: number, decimals: number): number {
  if (decimals < 0) {
    throw new Error('Decimal places cannot be negative');
  }

  const multiplier = Math.pow(10, decimals);
  const shifted = value * multiplier;

  // Banker's rounding: round half to even
  const rounded = Math.round(shifted);

  // Handle exact .5 case for banker's rounding
  if (Math.abs(shifted - rounded + 0.5) < Number.EPSILON) {
    // It's exactly .5, round to even
    const floor = Math.floor(shifted);
    const ceil = Math.ceil(shifted);
    return (floor % 2 === 0 ? floor : ceil) / multiplier;
  }

  return rounded / multiplier;
}

/**
 * Round a value to the appropriate decimals for a currency.
 */
export function roundForCurrency(value: number, currencyCode: string): number {
  const decimals = getCurrencyDecimals(currencyCode);
  return roundToDecimals(value, decimals);
}

/**
 * Convert an amount from one currency to another using the provided rate.
 * The rate should be the direct rate: 1 fromCurrency = rate toCurrency
 */
export function convertAmount(amount: number, rate: number): number {
  if (rate <= 0) {
    throw new Error('Exchange rate must be positive');
  }
  return amount * rate;
}

/**
 * Convert an amount and round to target currency decimals.
 */
export function convertAndRound(
  amount: number,
  rate: number,
  targetCurrencyCode: string
): number {
  const converted = convertAmount(amount, rate);
  return roundForCurrency(converted, targetCurrencyCode);
}

/**
 * Convert an amount to EUR equivalent using the inverse rate.
 * inverseRate should be: 1 foreignCurrency = inverseRate EUR
 */
export function convertToEur(amount: number, inverseRate: number): number {
  const eurAmount = convertAmount(amount, inverseRate);
  return roundForCurrency(eurAmount, 'EUR');
}

/**
 * Calculate EUR equivalents for invoice amounts.
 */
export interface InvoiceAmounts {
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface EurEquivalents {
  subtotalEur: number;
  vatAmountEur: number;
  totalEur: number;
}

export function calculateEurEquivalents(
  amounts: InvoiceAmounts,
  inverseRate: number
): EurEquivalents {
  return {
    subtotalEur: convertToEur(amounts.subtotal, inverseRate),
    vatAmountEur: convertToEur(amounts.vatAmount, inverseRate),
    totalEur: convertToEur(amounts.total, inverseRate),
  };
}

/**
 * Format a number for database storage (max 6 decimal places for rates).
 */
export function formatRateForStorage(rate: number): string {
  return rate.toFixed(6);
}

/**
 * Format a monetary amount for database storage (2 decimal places).
 */
export function formatAmountForStorage(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Check if an amount is effectively zero (accounting for floating point).
 */
export function isEffectivelyZero(amount: number, decimals: number = 2): boolean {
  const threshold = Math.pow(10, -(decimals + 1));
  return Math.abs(amount) < threshold;
}

/**
 * Get the smallest unit for a currency (e.g., 0.01 for EUR, 1 for JPY).
 */
export function getSmallestUnit(currencyCode: string): number {
  const decimals = getCurrencyDecimals(currencyCode);
  return Math.pow(10, -decimals);
}
