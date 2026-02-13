import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { updateUserFromStripeSubscription } from '@/lib/stripe/webhooks';

/**
 * Sync subscription from Stripe to DB. Use after checkout or when user still sees FREE after paying.
 * Stripe Dashboard > Developers > Webhooks: add endpoint for checkout.session.completed if missing.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Geen Stripe-klant gekoppeld', synced: false },
        { status: 400 }
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
      expand: ['data.items.data.price'],
    });

    const active = subscriptions.data[0];
    if (!active) {
      const trialing = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'trialing',
        limit: 1,
        expand: ['data.items.data.price'],
      });
      const sub = trialing.data[0];
      if (sub) {
        await updateUserFromStripeSubscription(sub);
        return NextResponse.json({ synced: true, tier: 'from Stripe (trialing)' });
      }
      return NextResponse.json(
        { error: 'Geen actief abonnement in Stripe', synced: false },
        { status: 404 }
      );
    }

    await updateUserFromStripeSubscription(active);
    return NextResponse.json({ synced: true });
  } catch (error) {
    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Synchronisatie mislukt' },
      { status: 500 }
    );
  }
}
