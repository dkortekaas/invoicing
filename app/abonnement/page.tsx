import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BillingPortalButton } from '@/components/subscription/billing-portal-button';
import { format } from 'date-fns';
import { nl, enGB } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { getServerT } from '@/lib/i18n';
import { getAppLocale } from '@/lib/i18n';
import { T } from '@/components/t';

export const dynamic = 'force-dynamic';

const EVENT_KEY_MAP: Record<string, string> = {
  SUBSCRIPTION_CREATED: 'eventSubCreated',
  SUBSCRIPTION_UPDATED: 'eventSubUpdated',
  SUBSCRIPTION_DELETED: 'eventSubDeleted',
  PAYMENT_SUCCEEDED: 'eventPaymentSucceeded',
  PAYMENT_FAILED: 'eventPaymentFailed',
  INVOICE_PAID: 'eventInvoicePaid',
  INVOICE_PAYMENT_FAILED: 'eventInvoicePaymentFailed',
};

export default async function AbonnementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [dbUser, t, locale] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptionEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    }),
    getServerT('subscriptionPage'),
    getAppLocale(),
  ]);

  if (!dbUser) {
    redirect('/login');
  }

  const dateLocale = locale === 'en' ? enGB : nl;
  const isPro = dbUser.subscriptionTier === 'PRO';
  const isActive = ['ACTIVE', 'TRIALING'].includes(dbUser.subscriptionStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <T ns="subscriptionPage" k="title" />
        </h1>
        <p className="text-muted-foreground">
          <T ns="subscriptionPage" k="description" />
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">
                  {isPro ? t('planPro') : t('planFree')}
                </CardTitle>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {t(`status${dbUser.subscriptionStatus}`)}
                </Badge>
              </div>

              {isPro && (
                <p className="text-muted-foreground">
                  {dbUser.billingCycle === 'YEARLY' ? t('pricePerYear') : t('pricePerMonth')}
                </p>
              )}
            </div>

            {isPro && <BillingPortalButton />}
          </div>
        </CardHeader>

        <CardContent>
          {isPro && dbUser.stripeCurrentPeriodEnd && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong><T ns="subscriptionPage" k="renewsOn" /></strong>{' '}
                {format(new Date(dbUser.stripeCurrentPeriodEnd), 'dd MMMM yyyy', { locale: dateLocale })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold mb-3">
              <T ns="subscriptionPage" k="yourFeatures" />
            </h3>
            {isPro ? (
              <>
                <FeatureItem k="proFeature1" />
                <FeatureItem k="proFeature2" />
                <FeatureItem k="proFeature3" />
                <FeatureItem k="proFeature4" />
                <FeatureItem k="proFeature5" />
                <FeatureItem k="proFeature6" />
                <FeatureItem k="proFeature7" />
              </>
            ) : (
              <>
                <FeatureItem k="freeFeature1" />
                <FeatureItem k="freeFeature2" />
                <FeatureItem k="freeFeature3" />
                <FeatureItem k="freeFeature4" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {dbUser.subscriptionEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle><T ns="subscriptionPage" k="history" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dbUser.subscriptionEvents.map((event: { id: string; type: string; createdAt: Date }) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{getEventLabel(event.type, t)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.createdAt), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureItem({ k }: { k: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-4 w-4 text-green-600" />
      <span className="text-sm"><T ns="subscriptionPage" k={k} /></span>
    </div>
  );
}

function getEventLabel(type: string, t: (key: string) => string): string {
  const key = EVENT_KEY_MAP[type];
  return key ? t(key) : type;
}
