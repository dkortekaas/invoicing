import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Resend webhook voor email events (opened, clicked, etc.)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!data?.email_id) {
      return NextResponse.json({ received: true });
    }

    const emailLog = await db.emailLog.findFirst({
      where: { resendId: data.email_id },
    });

    if (!emailLog) {
      return NextResponse.json({ received: true });
    }

    // Update based on event type
    const updates: any = {};

    switch (type) {
      case 'email.delivered':
        updates.status = 'DELIVERED';
        break;
      case 'email.opened':
        updates.status = 'OPENED';
        updates.openedAt = new Date();
        break;
      case 'email.clicked':
        updates.status = 'CLICKED';
        updates.clickedAt = new Date();
        break;
      case 'email.bounced':
        updates.status = 'BOUNCED';
        updates.error = data.bounce?.message || 'Email bounced';
        break;
    }

    if (Object.keys(updates).length > 0) {
      await db.emailLog.update({
        where: { id: emailLog.id },
        data: updates,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
