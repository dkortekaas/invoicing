import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';

/**
 * DELETE - Cancel an invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if user has PRO subscription
    const hasProAccess = await hasFeatureAccess(session.user.id, 'unlimited_invoices');
    
    if (!hasProAccess) {
      return NextResponse.json(
        { error: 'Alleen PRO accounts kunnen uitnodigingen beheren' },
        { status: 403 }
      );
    }

    const invitation = await db.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Uitnodiging niet gevonden' },
        { status: 404 }
      );
    }

    if (invitation.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze uitnodiging' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Alleen actieve uitnodigingen kunnen worden geannuleerd' },
        { status: 400 }
      );
    }

    await db.invitation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return NextResponse.json(
      { error: 'Annuleren uitnodiging mislukt' },
      { status: 500 }
    );
  }
}
