import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    amount: 1900, // €19.00
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY!,
    amount: 19000, // €190.00 (€15.83/month)
    interval: 'year' as const,
  },
} as const;
