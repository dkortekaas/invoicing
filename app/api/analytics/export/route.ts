import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateKPIs } from '@/lib/analytics/kpis';
import { getMonthlyTrends, getTopCustomers } from '@/lib/analytics/trends';
import { exportAnalyticsToExcel } from '@/lib/analytics/export';
import { startOfYear, endOfYear } from 'date-fns';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const start = startOfYear(now);
    const end = endOfYear(now);

    const [kpis, trends, customers] = await Promise.all([
      calculateKPIs(session.user.id, start, end),
      getMonthlyTrends(session.user.id, 12),
      getTopCustomers(session.user.id, 10, start, end),
    ]);

    const buffer = await exportAnalyticsToExcel({
      kpis,
      trends,
      customers,
      period: { start, end },
    });

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Analytics-${now.getFullYear()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
