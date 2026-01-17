import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      description, 
      projectId, 
      customerId,
      activityType,
      hourlyRate 
    } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Beschrijving is verplicht' },
        { status: 400 }
      );
    }

    // Stop eventuele andere running timers voor deze user
    await db.timeEntry.updateMany({
      where: {
        userId: session.user.id,
        isRunning: true,
      },
      data: {
        isRunning: false,
        endTime: new Date(),
      },
    });

    // Bepaal hourly rate
    let rate = hourlyRate;
    if (!rate && projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { defaultHourlyRate: true },
      });
      rate = project?.defaultHourlyRate;
    }
    if (!rate) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { defaultHourlyRate: true },
      });
      rate = user?.defaultHourlyRate || 0;
    }

    // Start nieuwe timer
    const entry = await db.timeEntry.create({
      data: {
        userId: session.user.id,
        description,
        projectId: projectId || null,
        customerId: customerId || null,
        activityType: activityType || null,
        startTime: new Date(),
        isRunning: true,
        hourlyRate: rate,
        duration: 0,
        amount: 0,
        billable: true,
      },
      include: {
        project: true,
        customer: true,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Start timer error:', error);
    return NextResponse.json(
      { error: 'Timer starten mislukt' },
      { status: 500 }
    );
  }
}
