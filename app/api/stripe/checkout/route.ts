import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, getAllValidPriceIds } from '@/lib/stripe/client';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { priceId } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        {
          error:
            'Geen abonnement gekozen. Controleer of op Vercel de Stripe price IDs zijn gezet (bijv. STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY).',
        },
        { status: 400 }
      );
    }

    // Validate price ID against all tier plans (uses STRIPE_PRICE_ID_* or NEXT_PUBLIC_STRIPE_PRICE_ID_*)
    const validPriceIds = getAllValidPriceIds();

    if (validPriceIds.length === 0) {
      console.error('Stripe: geen price IDs geconfigureerd in .env (STRIPE_PRICE_ID_* of NEXT_PUBLIC_STRIPE_PRICE_ID_*)');
      return NextResponse.json(
        { error: 'Betaling is niet geconfigureerd' },
        { status: 503 }
      );
    }

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Ongeldig abonnement. Controleer of de Stripe price IDs in .env kloppen.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'ideal'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement/checkout/canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' },
      metadata: { userId: user.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: unknown) {
    console.error('Checkout error:', error);

    const stripeError = error as { code?: string; param?: string };
    const code = stripeError?.code ?? '';
    const param = stripeError?.param ?? '';

    if (code === 'resource_missing') {
      if (param === 'customer') {
        await db.user.update({
          where: { id: session!.user!.id },
          data: { stripeCustomerId: null },
        });
        return NextResponse.json(
          {
            error:
              'De opgeslagen betaalgegevens kloppen niet meer (bijv. na wissel van Stripe-account). Klik nogmaals op Upgrade om door te gaan.',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error:
            'Deze prijs bestaat niet in Stripe. Controleer in Stripe Dashboard (Producten) of de price IDs in .env kloppen en of je test/live keys matcht.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Checkout kon niet worden gestart. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
