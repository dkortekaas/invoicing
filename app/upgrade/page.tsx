'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PricingCard } from '@/components/subscription/pricing-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';

const FREE_FEATURES = [
  'Basis facturen maken en versturen',
  'Klantenbeheer',
  'Productencatalogus',
  'PDF generatie',
  'Maximaal 50 facturen per maand',
];

const PRO_FEATURES = [
  'Alles van Free',
  'Onbeperkt facturen',
  'Recurring invoices & abonnementen',
  'Volledige BTW rapportage',
  'Tijdregistratie & project tracking',
  'Analytics dashboard & rapporten',
  'Onbeperkte email verzending',
  'Automatische herinneringen',
  'Export functionaliteit (Excel/PDF)',
  'Prioriteit support',
];

export default function UpgradePage() {
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

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Er is een fout opgetreden');
    }
  };

  return (
    <div className="container max-w-6xl py-12">
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
              <strong>Let op:</strong> Deze feature vereist een Pro abonnement
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

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          name="Free"
          price={0}
          interval="month"
          priceId=""
          features={FREE_FEATURES}
          currentPlan={true}
        />

        <PricingCard
          name="Pro"
          price={billingCycle === 'monthly' ? 1900 : 19000}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={
            billingCycle === 'monthly'
              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || ''
              : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || ''
          }
          features={PRO_FEATURES}
          popular={true}
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
