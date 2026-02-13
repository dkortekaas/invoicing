import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { STRIPE_PLANS } from '@/lib/stripe/client';

/**
 * Returns Stripe price IDs for the upgrade page. Uses server env vars so you only
 * need STRIPE_PRICE_ID_* on Vercel (no NEXT_PUBLIC_* required for checkout).
 */
export async function GET() {
  await auth(); // optional: allow unauthenticated for pricing page
  const ids = {
    starter: {
      monthly: STRIPE_PLANS.starter.monthly.priceId || null,
      yearly: STRIPE_PLANS.starter.yearly.priceId || null,
    },
    professional: {
      monthly: STRIPE_PLANS.professional.monthly.priceId || null,
      yearly: STRIPE_PLANS.professional.yearly.priceId || null,
    },
    business: {
      monthly: STRIPE_PLANS.business.monthly.priceId || null,
      yearly: STRIPE_PLANS.business.yearly.priceId || null,
    },
  };
  return NextResponse.json(ids);
}
