'use client';

import { useState, Suspense } from 'react';
import { toast } from 'sonner';
import { PricingCard } from '@/components/subscription/pricing-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const FREE_FEATURES = [
  'Tot 5 facturen per maand',
  'Klantenbeheer',
  'Productencatalogus',
  'PDF generatie',
];

const STARTER_FEATURES = [
  'Onbeperkt facturen',
  'OCR bonnetjes scannen',
  'Onkosten bijhouden',
  'BTW-overzichten',
  'Credit nota\'s',
  'Terugkerende facturen',
  'Export naar Excel/CSV',
];

const PROFESSIONAL_FEATURES = [
  'Alles van Starter',
  'iDEAL betaallinks',
  'Projecten & urenregistratie',
  'Slimme herinneringen',
  'Boekhoudkoppelingen',
  'Analytics dashboard',
];

const BUSINESS_FEATURES = [
  'Alles van Professional',
  'Multi-valuta',
  'Klantportaal',
  'Cashflow voorspellingen',
  'API toegang',
];

function UpgradePageContent() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature');

  const handleSubscribe = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error ?? 'Er is een fout opgetreden');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Er is een fout opgetreden');
    }
  };

  const getStarterPriceId = () =>
    billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_YEARLY || '';

  const getProfessionalPriceId = () =>
    billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '';

  const getBusinessPriceId = () =>
    billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_YEARLY || '';

  return (
    <div className="container max-w-7xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Kies het plan dat bij je past
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Start gratis, upgrade wanneer je klaar bent
        </p>

        {feature && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <p className="text-sm">
              <strong>Let op:</strong> Deze feature vereist een betaald abonnement
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : ''}>
            Maandelijks
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : ''}>
            Jaarlijks
            <span className="ml-2 text-green-600 text-sm">(Bespaar 17%)</span>
          </Label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <PricingCard
          name="Gratis"
          price={0}
          interval="month"
          priceId=""
          features={FREE_FEATURES}
          currentPlan={true}
        />

        <PricingCard
          name="Starter"
          price={billingCycle === 'monthly' ? 995 : 9900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getStarterPriceId()}
          features={STARTER_FEATURES}
          onSubscribe={handleSubscribe}
        />

        <PricingCard
          name="Professional"
          price={billingCycle === 'monthly' ? 1995 : 19900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getProfessionalPriceId()}
          features={PROFESSIONAL_FEATURES}
          popular={true}
          onSubscribe={handleSubscribe}
        />

        <PricingCard
          name="Business"
          price={billingCycle === 'monthly' ? 3495 : 34900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getBusinessPriceId()}
          features={BUSINESS_FEATURES}
          onSubscribe={handleSubscribe}
        />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Alle prijzen zijn exclusief BTW</p>
        <p className="mt-2">Je kunt je abonnement op elk moment opzeggen</p>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  );
}
