import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
        stripeSubscriptionId: true,
        billingCycle: true,
        invoiceCount: true,
        invoiceCountResetAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const payload: Record<string, unknown> = {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.stripeCurrentPeriodEnd,
      billingCycle: user.billingCycle,
      invoiceCount: user.invoiceCount,
      invoiceCountResetAt: user.invoiceCountResetAt,
      cancelAtPeriodEnd: false,
      cancelAt: null,
    };

    if (user.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const status = sub.status as string;
        if (['canceled', 'incomplete_expired', 'unpaid'].includes(status)) {
          await db.user.update({
            where: { id: session.user.id },
            data: {
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
              subscriptionStatus: 'FREE',
              subscriptionTier: 'FREE',
              billingCycle: null,
            },
          });
          payload.tier = 'FREE';
          payload.status = 'FREE';
          payload.currentPeriodEnd = null;
          payload.billingCycle = null;
          payload.cancelAtPeriodEnd = false;
          payload.cancelAt = null;
        } else {
          const raw = sub as unknown as { cancel_at_period_end?: boolean; cancel_at?: number };
          const cancelAt =
            typeof raw.cancel_at === 'number' && raw.cancel_at > 0
              ? new Date(raw.cancel_at * 1000)
              : null;
          payload.cancelAt = cancelAt;
          payload.cancelAtPeriodEnd =
            raw.cancel_at_period_end === true ||
            (cancelAt != null && cancelAt.getTime() > Date.now());
        }
      } catch (err) {
        console.error('Stripe subscription retrieve:', err);
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
