import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const runningEntries = await db.timeEntry.findMany({
      where: {
        userId: session.user.id,
        isRunning: true,
      },
      include: {
        project: true,
        customer: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(runningEntries);
  } catch (error) {
    console.error('Get running timers error:', error);
    return NextResponse.json(
      { error: 'Running timers ophalen mislukt' },
      { status: 500 }
    );
  }
}
