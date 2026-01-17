import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BillingPortalButton } from '@/components/subscription/billing-portal-button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AbonnementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      subscriptionEvents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!dbUser) {
    redirect('/login');
  }

  const isPro = dbUser.subscriptionTier === 'PRO';
  const isActive = ['ACTIVE', 'TRIALING'].includes(dbUser.subscriptionStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Beheer je abonnement en bekijk je factuurgeschiedenis
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </CardTitle>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {dbUser.subscriptionStatus}
                </Badge>
              </div>
              
              {isPro && (
                <p className="text-muted-foreground">
                  {dbUser.billingCycle === 'YEARLY' ? '€190/jaar' : '€19/maand'}
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
                <strong>Vernieuwt op:</strong>{' '}
                {format(new Date(dbUser.stripeCurrentPeriodEnd), 'dd MMMM yyyy', { locale: nl })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold mb-3">Jouw features:</h3>
            {isPro ? (
              <>
                <FeatureItem text="Onbeperkt facturen" />
                <FeatureItem text="Recurring invoices" />
                <FeatureItem text="BTW rapportage" />
                <FeatureItem text="Tijdregistratie" />
                <FeatureItem text="Analytics dashboard" />
                <FeatureItem text="Onbeperkte emails" />
                <FeatureItem text="Export functionaliteit" />
              </>
            ) : (
              <>
                <FeatureItem text="Basis facturen" />
                <FeatureItem text="Maximaal 50 facturen/maand" />
                <FeatureItem text="Klantenbeheer" />
                <FeatureItem text="PDF generatie" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event History */}
      {dbUser.subscriptionEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dbUser.subscriptionEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{getEventLabel(event.type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.createdAt), 'dd MMM yyyy HH:mm', { locale: nl })}
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

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-4 w-4 text-green-600" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    SUBSCRIPTION_CREATED: 'Abonnement gestart',
    SUBSCRIPTION_UPDATED: 'Abonnement bijgewerkt',
    SUBSCRIPTION_DELETED: 'Abonnement beëindigd',
    PAYMENT_SUCCEEDED: 'Betaling geslaagd',
    PAYMENT_FAILED: 'Betaling mislukt',
    INVOICE_PAID: 'Factuur betaald',
    INVOICE_PAYMENT_FAILED: 'Factuur betaling mislukt',
  };
  return labels[type] || type;
}
