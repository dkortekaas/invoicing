import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const firstItem = subscription.items.data[0];
  
  if (!firstItem) {
    console.error('Subscription has no items:', subscription.id);
    return;
  }
  
  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: firstItem.price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      subscriptionStatus: mapStripeStatus(subscription.status),
      subscriptionTier: 'PRO',
      billingCycle: firstItem.price.recurring?.interval === 'year' 
        ? 'YEARLY' 
        : 'MONTHLY',
    },
  });

  // Log event
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
  const customerId = subscription.customer as string;
  const firstItem = subscription.items.data[0];

  if (!firstItem) {
    console.error('Subscription has no items:', subscription.id);
    return;
  }

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripePriceId: firstItem.price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      subscriptionStatus: mapStripeStatus(subscription.status),
      billingCycle: firstItem.price.recurring?.interval === 'year'
        ? 'YEARLY'
        : 'MONTHLY',
    },
  });

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
