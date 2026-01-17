import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMonthlyTrends } from '@/lib/analytics/trends';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const months = parseInt(searchParams.get('months') || '12');

  try {
    const trends = await getMonthlyTrends(session.user.id, months);

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Get trends error:', error);
    return NextResponse.json(
      { error: 'Failed to get trends' },
      { status: 500 }
    );
  }
}
