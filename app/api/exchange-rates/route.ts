import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getLatestRates } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exchange-rates
 *
 * Returns exchange rates.
 * Optional query params:
 * - date=YYYY-MM-DD: Get rates for specific date (defaults to latest)
 * - currency=USD: Get rate for specific currency
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const currencyParam = searchParams.get('currency');

    // If specific date requested
    if (dateParam) {
      const date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }

      // Get rates for that date or closest previous date
      const rates = await db.exchangeRate.findMany({
        where: currencyParam
          ? {
              currencyCode: currencyParam.toUpperCase(),
              date: { lte: date },
            }
          : {
              date: { lte: date },
            },
        orderBy: { date: 'desc' },
        distinct: currencyParam ? undefined : ['currencyCode'],
        include: {
          currency: {
            select: {
              name: true,
              nameDutch: true,
              symbol: true,
              decimalPlaces: true,
            },
          },
        },
      });

      // If specific currency, return first (most recent) result
      if (currencyParam) {
        const rate = rates[0];
        if (!rate) {
          return NextResponse.json(
            { error: `No rate found for ${currencyParam}` },
            { status: 404 }
          );
        }
        return NextResponse.json({ rate });
      }

      return NextResponse.json({
        rates,
        requestedDate: dateParam,
      });
    }

    // Return latest rates for all currencies
    const latestRatesMap = await getLatestRates();
    const rates = Array.from(latestRatesMap.entries()).map(([code, rateInfo]) => {
      const { currencyCode: _, ...rest } = rateInfo;
      return {
        currencyCode: code,
        ...rest,
      };
    });

    // Get the most recent date
    const latestRate = await db.exchangeRate.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    return NextResponse.json({
      rates,
      latestDate: latestRate?.date || null,
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
