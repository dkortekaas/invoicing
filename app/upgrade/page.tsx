'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { toast } from 'sonner';
import { PricingCard } from '@/components/subscription/pricing-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/locale-provider';

type PriceIds = {
  starter: { monthly: string | null; yearly: string | null };
  professional: { monthly: string | null; yearly: string | null };
  business: { monthly: string | null; yearly: string | null };
};

function UpgradePageContent() {
  const { t } = useTranslations('upgradePage');

  const freeFeatures = useMemo(() => [
    t('freeFeature1'),
    t('freeFeature2'),
    t('freeFeature3'),
    t('freeFeature4'),
  ], [t]);

  const starterFeatures = useMemo(() => [
    t('starterFeature1'),
    t('starterFeature2'),
    t('starterFeature3'),
    t('starterFeature4'),
    t('starterFeature5'),
    t('starterFeature6'),
    t('starterFeature7'),
  ], [t]);

  const professionalFeatures = useMemo(() => [
    t('professionalFeature1'),
    t('professionalFeature2'),
    t('professionalFeature3'),
    t('professionalFeature4'),
    t('professionalFeature5'),
    t('professionalFeature6'),
  ], [t]);

  const businessFeatures = useMemo(() => [
    t('businessFeature1'),
    t('businessFeature2'),
    t('businessFeature3'),
    t('businessFeature4'),
    t('businessFeature5'),
  ], [t]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [priceIds, setPriceIds] = useState<PriceIds | null>(null);
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stripe/price-ids')
      .then((res) => res.ok ? res.json() : null)
      .then((data: PriceIds | null) => {
        if (!cancelled && data) setPriceIds(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const getStarterPriceId = () => {
    const fromApi = billingCycle === 'monthly' ? priceIds?.starter.monthly : priceIds?.starter.yearly;
    if (fromApi) return fromApi;
    return billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_YEARLY || '';
  };

  const getProfessionalPriceId = () => {
    const fromApi = billingCycle === 'monthly' ? priceIds?.professional.monthly : priceIds?.professional.yearly;
    if (fromApi) return fromApi;
    return billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '';
  };

  const getBusinessPriceId = () => {
    const fromApi = billingCycle === 'monthly' ? priceIds?.business.monthly : priceIds?.business.yearly;
    if (fromApi) return fromApi;
    return billingCycle === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_YEARLY || '';
  };

  return (
    <div className="container max-w-7xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('subtitle')}
        </p>

        {feature && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <p className="text-sm">
              {t('featureRequiredNotice')}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : ''}>
            {t('monthly')}
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : ''}>
            {t('yearly')}
            <span className="ml-2 text-green-600 text-sm">{t('yearlySave')}</span>
          </Label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <PricingCard
          name={t('planFree')}
          price={0}
          interval="month"
          priceId=""
          features={freeFeatures}
          currentPlan={true}
        />

        <PricingCard
          name={t('planStarter')}
          price={billingCycle === 'monthly' ? 995 : 9900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getStarterPriceId()}
          features={starterFeatures}
          onSubscribe={handleSubscribe}
        />

        <PricingCard
          name={t('planProfessional')}
          price={billingCycle === 'monthly' ? 1995 : 19900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getProfessionalPriceId()}
          features={professionalFeatures}
          popular={true}
          onSubscribe={handleSubscribe}
        />

        <PricingCard
          name={t('planBusiness')}
          price={billingCycle === 'monthly' ? 3495 : 34900}
          interval={billingCycle === 'monthly' ? 'month' : 'year'}
          priceId={getBusinessPriceId()}
          features={businessFeatures}
          onSubscribe={handleSubscribe}
        />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>{t('pricesExclVat')}</p>
        <p className="mt-2">{t('cancelAnytime')}</p>
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
