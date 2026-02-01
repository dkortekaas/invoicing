/**
 * ECB (European Central Bank) Exchange Rate Sync Service
 *
 * Fetches daily exchange rates from the ECB and stores them in the database.
 * ECB publishes new rates around 16:00 CET each business day.
 * Rates are relative to EUR (1 EUR = X foreign currency).
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

interface ECBRate {
  currency: string;
  rate: number;
}

interface ECBParseResult {
  date: Date;
  rates: ECBRate[];
}

/**
 * Parse the ECB XML response to extract exchange rates.
 * The ECB XML format is:
 * <Cube time="2026-01-24">
 *   <Cube currency="USD" rate="1.0823"/>
 *   <Cube currency="JPY" rate="163.45"/>
 *   ...
 * </Cube>
 */
function parseECBXml(xml: string): ECBParseResult {
  // Extract date from time attribute
  const dateMatch = xml.match(/time='(\d{4}-\d{2}-\d{2})'/);
  if (!dateMatch || !dateMatch[1]) {
    throw new Error('Could not parse ECB date from XML');
  }
  const date = new Date(dateMatch[1]);

  // Extract currency rates using regex (simple XML parsing without external deps)
  const rates: ECBRate[] = [];
  const rateRegex = /currency='([A-Z]{3})'\s+rate='([\d.]+)'/g;
  let match;

  while ((match = rateRegex.exec(xml)) !== null) {
    const currencyCode = match[1];
    const rateValue = match[2];
    if (currencyCode && rateValue) {
      rates.push({
        currency: currencyCode,
        rate: parseFloat(rateValue),
      });
    }
  }

  if (rates.length === 0) {
    throw new Error('No exchange rates found in ECB XML');
  }

  return { date, rates };
}

/**
 * Fetch exchange rates from ECB daily XML feed.
 * Returns the date and rates for that day.
 */
export async function fetchECBRates(): Promise<ECBParseResult> {
  const response = await fetch(ECB_DAILY_URL, {
    headers: {
      Accept: 'application/xml',
    },
    // Disable caching to always get fresh rates
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ECB rates: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseECBXml(xml);
}

/**
 * Sync ECB exchange rates to the database.
 * - Fetches latest rates from ECB
 * - Stores/updates rates for supported currencies
 * - Calculates inverse rates (X foreign = 1 EUR)
 *
 * Returns the number of rates synced and the date.
 */
export async function syncECBRates(): Promise<{ synced: number; date: Date }> {
  // Fetch latest rates from ECB
  const { date, rates } = await fetchECBRates();

  // Get list of supported currencies from database
  const supportedCurrencies = await db.currency.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });

  // Create a map for quick lookup
  const currencyMap = new Map(supportedCurrencies.map((c) => [c.code, c.id]));

  let synced = 0;

  // Store each rate (skip EUR as it's always 1.0)
  for (const ecbRate of rates) {
    const currencyId = currencyMap.get(ecbRate.currency);
    if (!currencyId) {
      // Currency not in our supported list, skip
      continue;
    }

    // Calculate inverse rate: 1 foreign = X EUR
    const inverseRate = 1 / ecbRate.rate;

    // Upsert the exchange rate
    await db.exchangeRate.upsert({
      where: {
        currencyCode_date: {
          currencyCode: ecbRate.currency,
          date: date,
        },
      },
      update: {
        rate: new Prisma.Decimal(ecbRate.rate.toFixed(6)),
        inverseRate: new Prisma.Decimal(inverseRate.toFixed(6)),
        source: 'ECB',
      },
      create: {
        currencyId,
        currencyCode: ecbRate.currency,
        date: date,
        rate: new Prisma.Decimal(ecbRate.rate.toFixed(6)),
        inverseRate: new Prisma.Decimal(inverseRate.toFixed(6)),
        source: 'ECB',
      },
    });

    synced++;
  }

  return { synced, date };
}

/**
 * Get the latest exchange rate date from the database.
 * Useful for checking if we need to sync.
 */
export async function getLatestRateDate(): Promise<Date | null> {
  const latest = await db.exchangeRate.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  return latest?.date || null;
}

/**
 * Check if we should sync rates (no rates for today).
 * Returns true if sync is needed.
 */
export async function shouldSyncRates(): Promise<boolean> {
  const latestDate = await getLatestRateDate();
  if (!latestDate) {
    return true; // No rates at all, need to sync
  }

  // Check if we have rates for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestDateNormalized = new Date(latestDate);
  latestDateNormalized.setHours(0, 0, 0, 0);

  return latestDateNormalized < today;
}
