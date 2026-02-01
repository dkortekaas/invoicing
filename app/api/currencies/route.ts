import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/currencies
 *
 * Returns all active currencies.
 * Optional query params:
 * - enabled=true: Only return user's enabled currencies
 * - withRates=true: Include latest exchange rates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enabledOnly = searchParams.get('enabled') === 'true';
    const withRates = searchParams.get('withRates') === 'true';

    // If filtering by enabled, need to get user's settings
    if (enabledOnly) {
      const userId = await getCurrentUserId();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const settings = await db.currencySettings.findUnique({
        where: { userId },
        include: {
          enabledCurrencies: {
            orderBy: { sortOrder: 'asc' },
          },
          baseCurrency: true,
        },
      });

      if (!settings) {
        // No settings yet, return default (EUR only)
        const eurCurrency = await db.currency.findUnique({
          where: { code: 'EUR' },
        });

        return NextResponse.json({
          currencies: eurCurrency ? [eurCurrency] : [],
          baseCurrency: eurCurrency,
        });
      }

      let currencies = settings.enabledCurrencies;

      // Optionally include rates
      if (withRates) {
        currencies = await Promise.all(
          currencies.map(async (currency) => {
            if (currency.code === 'EUR') {
              return { ...currency, latestRate: null };
            }

            const latestRate = await db.exchangeRate.findFirst({
              where: { currencyCode: currency.code },
              orderBy: { date: 'desc' },
              select: {
                rate: true,
                inverseRate: true,
                date: true,
                source: true,
              },
            });

            return { ...currency, latestRate };
          })
        );
      }

      return NextResponse.json({
        currencies,
        baseCurrency: settings.baseCurrency,
      });
    }

    // Return all active currencies
    let currencies = await db.currency.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Optionally include rates
    if (withRates) {
      currencies = await Promise.all(
        currencies.map(async (currency) => {
          if (currency.code === 'EUR') {
            return { ...currency, latestRate: null };
          }

          const latestRate = await db.exchangeRate.findFirst({
            where: { currencyCode: currency.code },
            orderBy: { date: 'desc' },
            select: {
              rate: true,
              inverseRate: true,
              date: true,
              source: true,
            },
          });

          return { ...currency, latestRate };
        })
      );
    }

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}
