import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate, convertAndRound } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exchange-rates/convert
 *
 * Convert an amount between currencies.
 * Query params:
 * - from: Source currency code (e.g., 'EUR')
 * - to: Target currency code (e.g., 'USD')
 * - amount: Amount to convert
 * - date: Optional date for historical rate (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from')?.toUpperCase();
    const to = searchParams.get('to')?.toUpperCase();
    const amountStr = searchParams.get('amount');
    const dateParam = searchParams.get('date');

    // Validate required params
    if (!from || !to || !amountStr) {
      return NextResponse.json(
        { error: 'Missing required params: from, to, amount' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Parse date if provided
    let date: Date | undefined;
    if (dateParam) {
      date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }

    // Get exchange rate
    const rateInfo = await getExchangeRate({ from, to, date });

    // Convert amount
    const convertedAmount = convertAndRound(amount, rateInfo.rate, to);

    return NextResponse.json({
      from,
      to,
      amount,
      convertedAmount,
      rate: rateInfo.rate,
      inverseRate: rateInfo.inverseRate,
      rateDate: rateInfo.date,
      source: rateInfo.source,
    });
  } catch (error) {
    console.error('Error converting currency:', error);

    if (error instanceof Error && error.message.includes('No exchange rate found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}
