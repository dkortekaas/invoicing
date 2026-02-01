import { NextResponse } from 'next/server';
import { syncECBRates, shouldSyncRates, getLatestRateDate } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/sync-exchange-rates
 *
 * Cron job to sync exchange rates from ECB.
 * Should be scheduled daily at 16:30 CET (ECB publishes ~16:00).
 *
 * Authentication: Bearer token via CRON_SECRET
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Check if we need to sync
    const needsSync = await shouldSyncRates();
    const previousLatestDate = await getLatestRateDate();

    if (!needsSync) {
      return NextResponse.json({
        status: 'skipped',
        message: 'Rates already up to date',
        latestDate: previousLatestDate,
      });
    }

    // Sync rates from ECB
    const result = await syncECBRates();

    console.log('Exchange rate sync completed:', {
      synced: result.synced,
      date: result.date,
    });

    return NextResponse.json({
      status: 'success',
      synced: result.synced,
      date: result.date,
      previousLatestDate,
    });
  } catch (error) {
    console.error('Exchange rate sync error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
