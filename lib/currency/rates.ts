/**
 * Exchange Rate Service
 *
 * Provides exchange rate lookups with date fallback logic.
 * If rate for requested date is not available, falls back to the most recent previous date.
 * This handles weekends and holidays when ECB doesn't publish rates.
 */

import { db } from '@/lib/db';
import { Prisma, RateSource } from '@prisma/client';

export interface ExchangeRateResult {
  rate: number;
  inverseRate: number;
  date: Date;
  source: RateSource;
  currencyCode: string;
}

export interface GetRateOptions {
  /** Source currency code (e.g., 'EUR') */
  from: string;
  /** Target currency code (e.g., 'USD') */
  to: string;
  /** Date for the rate (defaults to today) */
  date?: Date;
}

/**
 * Normalize date to midnight UTC for consistent date comparisons.
 */
function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get exchange rate between two currencies for a specific date.
 *
 * Logic:
 * - If both currencies are EUR, rate is 1.0
 * - If from=EUR, get direct rate from database
 * - If to=EUR, get inverse rate from database
 * - Otherwise, calculate cross rate through EUR
 *
 * Falls back to most recent previous date if rate not available.
 */
export async function getExchangeRate(options: GetRateOptions): Promise<ExchangeRateResult> {
  const { from, to, date = new Date() } = options;
  const normalizedDate = normalizeDate(date);

  // Same currency = rate is 1.0
  if (from === to) {
    return {
      rate: 1,
      inverseRate: 1,
      date: normalizedDate,
      source: 'ECB',
      currencyCode: from,
    };
  }

  // If one of them is EUR, we can get direct rate
  if (from === 'EUR') {
    return await getRateFromEur(to, normalizedDate);
  }

  if (to === 'EUR') {
    const result = await getRateFromEur(from, normalizedDate);
    return {
      rate: result.inverseRate,
      inverseRate: result.rate,
      date: result.date,
      source: result.source,
      currencyCode: from,
    };
  }

  // Cross rate: from -> EUR -> to
  const fromToEur = await getRateFromEur(from, normalizedDate);
  const eurToTo = await getRateFromEur(to, normalizedDate);

  // Cross rate calculation: (1/fromRate) * toRate
  const crossRate = fromToEur.inverseRate * eurToTo.rate;

  return {
    rate: crossRate,
    inverseRate: 1 / crossRate,
    date: fromToEur.date, // Use the date from the first lookup
    source: fromToEur.source,
    currencyCode: `${from}/${to}`,
  };
}

/**
 * Get rate from EUR to a foreign currency.
 * Falls back to most recent previous date if not available.
 */
async function getRateFromEur(currencyCode: string, date: Date): Promise<ExchangeRateResult> {
  // Try exact date first
  let rate = await db.exchangeRate.findUnique({
    where: {
      currencyCode_date: {
        currencyCode,
        date,
      },
    },
  });

  // If not found, get most recent previous rate
  if (!rate) {
    rate = await db.exchangeRate.findFirst({
      where: {
        currencyCode,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });
  }

  if (!rate) {
    throw new Error(
      `No exchange rate found for ${currencyCode}. Please sync exchange rates first.`
    );
  }

  return {
    rate: (rate.rate as Prisma.Decimal).toNumber(),
    inverseRate: (rate.inverseRate as Prisma.Decimal).toNumber(),
    date: rate.date,
    source: rate.source,
    currencyCode,
  };
}

/**
 * Get latest exchange rates for all active currencies.
 * Returns a Map of currency code to rate (EUR -> currency).
 */
export async function getLatestRates(): Promise<Map<string, ExchangeRateResult>> {
  const currencies = await db.currency.findMany({
    where: { isActive: true, isDefault: false }, // Exclude EUR
    select: { code: true },
  });

  const results = new Map<string, ExchangeRateResult>();

  // EUR is always 1.0
  results.set('EUR', {
    rate: 1,
    inverseRate: 1,
    date: new Date(),
    source: 'ECB',
    currencyCode: 'EUR',
  });

  // Get latest rate for each currency
  for (const currency of currencies) {
    try {
      const rate = await getExchangeRate({ from: 'EUR', to: currency.code });
      results.set(currency.code, rate);
    } catch {
      // Skip currencies without rates
      console.warn(`No rate available for ${currency.code}`);
    }
  }

  return results;
}

/**
 * Get historical exchange rates for a currency.
 */
export async function getHistoricalRates(
  currencyCode: string,
  startDate: Date,
  endDate: Date
): Promise<ExchangeRateResult[]> {
  const rates = await db.exchangeRate.findMany({
    where: {
      currencyCode,
      date: {
        gte: normalizeDate(startDate),
        lte: normalizeDate(endDate),
      },
    },
    orderBy: { date: 'asc' },
  });

  return rates.map((rate) => ({
    rate: (rate.rate as Prisma.Decimal).toNumber(),
    inverseRate: (rate.inverseRate as Prisma.Decimal).toNumber(),
    date: rate.date,
    source: rate.source,
    currencyCode: rate.currencyCode,
  }));
}

/**
 * Check if exchange rate is available for a given date.
 */
export async function hasRateForDate(currencyCode: string, date: Date): Promise<boolean> {
  if (currencyCode === 'EUR') {
    return true;
  }

  const rate = await db.exchangeRate.findFirst({
    where: {
      currencyCode,
      date: { lte: normalizeDate(date) },
    },
    select: { id: true },
  });

  return rate !== null;
}
