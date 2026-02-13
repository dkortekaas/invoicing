import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const returnUrl =
      typeof body.returnUrl === 'string' && body.returnUrl
        ? body.returnUrl
        : `${process.env.NEXT_PUBLIC_APP_URL || ''}/abonnement`;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Geen abonnement gevonden' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const resolvedReturnUrl = returnUrl.startsWith('http') ? returnUrl : `${baseUrl}${returnUrl.startsWith('/') ? '' : '/'}${returnUrl}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: resolvedReturnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
