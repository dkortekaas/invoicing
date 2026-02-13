import { db } from '@/lib/db';
import Stripe from 'stripe';
import { getTierFromPriceId } from './client';

const TERMINAL_SUBSCRIPTION_STATUSES = ['canceled', 'incomplete_expired', 'unpaid'] as const;

/** Shared: update user record from a Stripe subscription (used by webhooks and sync). */
export async function updateUserFromStripeSubscription(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const firstItem = subscription.items.data[0];
  const status = subscription.status;

  if (TERMINAL_SUBSCRIPTION_STATUSES.includes(status as (typeof TERMINAL_SUBSCRIPTION_STATUSES)[number])) {
    await db.user.update({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        subscriptionStatus: 'FREE',
        subscriptionTier: 'FREE',
        billingCycle: null,
      },
    });
    return;
  }

  if (!firstItem) {
    console.error('Subscription has no items:', subscription.id);
    return;
  }

  const periodEndRaw = firstItem.current_period_end;
  const periodEndMs =
    typeof periodEndRaw === 'number'
      ? periodEndRaw * 1000
      : typeof periodEndRaw === 'string'
        ? parseInt(periodEndRaw, 10) * 1000
        : NaN;
  const stripeCurrentPeriodEnd =
    Number.isFinite(periodEndMs) && periodEndMs > 0
      ? new Date(periodEndMs)
      : undefined;

  const billingCycle =
    firstItem.price.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY';

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: firstItem.price.id,
      ...(stripeCurrentPeriodEnd && { stripeCurrentPeriodEnd }),
      subscriptionStatus: mapStripeStatus(subscription.status),
      subscriptionTier: getTierFromPriceId(firstItem.price.id),
      billingCycle,
    },
  });
}

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  await updateUserFromStripeSubscription(subscription);

  const customerId = subscription.customer as string;
  const firstItem = subscription.items.data[0];
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (user && firstItem) {
    await db.subscriptionEvent.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_CREATED',
        stripeEventId: `sub_created_${subscription.id}`,
        metadata: {
          subscriptionId: subscription.id,
          priceId: firstItem.price.id,
        },
      },
    });
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  await updateUserFromStripeSubscription(subscription);

  const customerId = subscription.customer as string;
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await db.subscriptionEvent.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_UPDATED',
        stripeEventId: `sub_updated_${subscription.id}_${Date.now()}`,
        metadata: {
          subscriptionId: subscription.id,
          status: subscription.status,
        },
      },
    });
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      subscriptionStatus: 'CANCELED',
      subscriptionTier: 'FREE',
      billingCycle: null,
    },
  });

  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await db.subscriptionEvent.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_DELETED',
        stripeEventId: `sub_deleted_${subscription.id}`,
      },
    });
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await db.subscriptionEvent.create({
      data: {
        userId: user.id,
        type: 'INVOICE_PAID',
        stripeEventId: invoice.id,
        metadata: {
          amount: invoice.amount_paid,
          currency: invoice.currency,
        },
      },
    });

    const inv = invoice as { billing_reason?: string; subscription?: string };
    const billingReason = inv.billing_reason;
    const isSubscriptionInvoice =
      Boolean(invoice.parent?.subscription_details?.subscription) ||
      Boolean(inv.subscription) ||
      (typeof billingReason === 'string' &&
        ['subscription', 'subscription_create', 'subscription_cycle', 'subscription_threshold', 'subscription_update'].includes(billingReason));
    if (isSubscriptionInvoice) {
      const { createExpenseFromStripeInvoice } = await import(
        './create-expense-from-invoice'
      );
      try {
        await createExpenseFromStripeInvoice(invoice, user.id);
      } catch (err) {
        console.error('Create expense from Stripe invoice:', err);
      }
    }
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await db.subscriptionEvent.create({
      data: {
        userId: user.id,
        type: 'INVOICE_PAYMENT_FAILED',
        stripeEventId: invoice.id,
        metadata: {
          amount: invoice.amount_due,
        },
      },
    });

    // TODO: Send notification email
  }
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'FREE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID' {
  const mapping: Record<Stripe.Subscription.Status, 'FREE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID'> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    unpaid: 'UNPAID',
    paused: 'CANCELED',
  };

  return mapping[status] || 'FREE';
}

/**
 * When checkout completes, subscription might not be synced yet (e.g. webhook missed).
 * Fetch subscription from Stripe and update user.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const stripe = (await import('./client')).stripe;
  const subscription =
    typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription, {
          expand: ['items.data.price'],
        })
      : session.subscription;

  await updateUserFromStripeSubscription(subscription);
}
