import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isSuperuser } from '@/lib/auth/admin-guard';

const VALID_TIERS = ['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS'];
const VALID_STATUSES = ['FREE', 'ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSuper = await isSuperuser(session.user.id);
  if (!isSuper) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { subscriptionTier, subscriptionStatus, isManualSubscription, manualSubscriptionExpiresAt, manualSubscriptionNote } = body;

    if (subscriptionTier && !VALID_TIERS.includes(subscriptionTier)) {
      return NextResponse.json(
        { error: 'Ongeldige abonnementstier' },
        { status: 400 }
      );
    }

    if (subscriptionStatus && !VALID_STATUSES.includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Ongeldige abonnementsstatus' },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (subscriptionTier !== undefined) {
      updateData.subscriptionTier = subscriptionTier;
      // When setting to FREE, also set status to FREE
      if (subscriptionTier === 'FREE') {
        updateData.subscriptionStatus = 'FREE';
        updateData.isManualSubscription = false;
        updateData.manualSubscriptionExpiresAt = null;
        updateData.manualSubscriptionNote = null;
      }
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (isManualSubscription !== undefined) {
      updateData.isManualSubscription = isManualSubscription;
    }

    if (manualSubscriptionExpiresAt !== undefined) {
      updateData.manualSubscriptionExpiresAt = manualSubscriptionExpiresAt
        ? new Date(manualSubscriptionExpiresAt)
        : null;
    }

    if (manualSubscriptionNote !== undefined) {
      updateData.manualSubscriptionNote = manualSubscriptionNote || null;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user subscription error:', error);
    return NextResponse.json(
      { error: 'Abonnement bijwerken mislukt' },
      { status: 500 }
    );
  }
}
