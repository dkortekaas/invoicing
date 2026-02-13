import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { createExpenseFromStripeInvoice } from '@/lib/stripe/create-expense-from-invoice';

const SUBSCRIPTION_BILLING_REASONS = [
  'subscription',
  'subscription_create',
  'subscription_cycle',
  'subscription_threshold',
  'subscription_update',
];

/**
 * Sync paid subscription invoices to kosten. Creates expenses for any paid
 * subscription invoice that does not yet have an expense. Use when webhook
 * missed or to backfill.
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
        { error: 'Geen Stripe-klant', created: 0 },
        { status: 400 }
      );
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'paid',
      limit: 24,
    });

    let created = 0;
    for (const inv of invoices.data) {
      const reason = (inv as { billing_reason?: string }).billing_reason;
      const isSub =
        Boolean((inv as { subscription?: string }).subscription) ||
        (typeof reason === 'string' && SUBSCRIPTION_BILLING_REASONS.includes(reason));
      if (!isSub) continue;

      try {
        const full = await stripe.invoices.retrieve(inv.id, { expand: ['lines.data.price'] });
        if (await createExpenseFromStripeInvoice(full, session.user.id)) created++;
      } catch (e) {
        console.error('Sync invoice expense:', inv.id, e);
      }
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error('Sync invoice expense error:', error);
    return NextResponse.json(
      { error: 'Synchronisatie mislukt' },
      { status: 500 }
    );
  }
}
