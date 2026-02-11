import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateAmount, roundDuration } from '@/lib/time/calculations';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = await hasFeatureAccess(session.user.id, 'time_tracking');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Urenregistratie is een premium functie. Upgrade je abonnement.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    const entry = await db.timeEntry.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Time entry niet gevonden' },
        { status: 404 }
      );
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!entry.isRunning) {
      return NextResponse.json(
        { error: 'Timer is niet actief' },
        { status: 400 }
      );
    }

    const endTime = new Date();
    
    // Bereken duration
    const durationMinutes = Math.max(
      1,
      Math.floor((endTime.getTime() - entry.startTime.getTime()) / (1000 * 60))
    );
    
    // Rond af indien nodig
    const roundedMinutes = roundDuration(
      durationMinutes,
      entry.user.roundingInterval || 0
    );
    
    const duration = roundedMinutes / 60; // Convert naar uren
    const amount = calculateAmount(duration, Number(entry.hourlyRate));

    // Update entry
    const updated = await db.timeEntry.update({
      where: { id },
      data: {
        endTime,
        isRunning: false,
        duration,
        amount,
      },
      include: {
        project: true,
        customer: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Stop timer error:', error);
    return NextResponse.json(
      { error: 'Timer stoppen mislukt' },
      { status: 500 }
    );
  }
}
