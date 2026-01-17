import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTopCustomers } from '@/lib/analytics/trends';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const customers = await getTopCustomers(
      session.user.id,
      limit,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Get customer analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get customer analytics' },
      { status: 500 }
    );
  }
}
