import Stripe from 'stripe';
import type { SubscriptionTier } from './subscriptions';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Use server env first, fallback to NEXT_PUBLIC_ so one set of vars works for both client and API validation
export const STRIPE_PLANS = {
  starter: {
    monthly: {
      priceId:
        process.env.STRIPE_PRICE_ID_STARTER_MONTHLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY ||
        '',
      amount: 995, // €9,95
      interval: 'month' as const,
    },
    yearly: {
      priceId:
        process.env.STRIPE_PRICE_ID_STARTER_YEARLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_YEARLY ||
        '',
      amount: 9900, // €99,00 (€8,25/maand)
      interval: 'year' as const,
    },
  },
  professional: {
    monthly: {
      priceId:
        process.env.STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY ||
        '',
      amount: 1995, // €19,95
      interval: 'month' as const,
    },
    yearly: {
      priceId:
        process.env.STRIPE_PRICE_ID_PROFESSIONAL_YEARLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_YEARLY ||
        '',
      amount: 19900, // €199,00 (€16,58/maand)
      interval: 'year' as const,
    },
  },
  business: {
    monthly: {
      priceId:
        process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY ||
        '',
      amount: 3495, // €34,95
      interval: 'month' as const,
    },
    yearly: {
      priceId:
        process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_YEARLY ||
        '',
      amount: 34900, // €349,00 (€29,08/maand)
      interval: 'year' as const,
    },
  },
} as const;

export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (
    priceId === STRIPE_PLANS.starter.monthly.priceId ||
    priceId === STRIPE_PLANS.starter.yearly.priceId
  ) {
    return 'STARTER';
  }
  if (
    priceId === STRIPE_PLANS.professional.monthly.priceId ||
    priceId === STRIPE_PLANS.professional.yearly.priceId
  ) {
    return 'PROFESSIONAL';
  }
  if (
    priceId === STRIPE_PLANS.business.monthly.priceId ||
    priceId === STRIPE_PLANS.business.yearly.priceId
  ) {
    return 'BUSINESS';
  }
  // Fallback for legacy or unknown price IDs
  return 'PROFESSIONAL';
}

export function getAllValidPriceIds(): string[] {
  return [
    STRIPE_PLANS.starter.monthly.priceId,
    STRIPE_PLANS.starter.yearly.priceId,
    STRIPE_PLANS.professional.monthly.priceId,
    STRIPE_PLANS.professional.yearly.priceId,
    STRIPE_PLANS.business.monthly.priceId,
    STRIPE_PLANS.business.yearly.priceId,
  ].filter(Boolean);
}
