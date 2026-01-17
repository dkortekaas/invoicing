import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateKPIs } from '@/lib/analytics/kpis';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const kpis = await calculateKPIs(
      session.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}
