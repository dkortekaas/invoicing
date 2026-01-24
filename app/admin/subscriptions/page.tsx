import { requireSuperuser } from '@/lib/auth/admin-guard';
import { db } from '@/lib/db';
import { SubscriptionManager } from '@/components/admin/subscription-manager';

export default async function SubscriptionsPage() {
  await requireSuperuser();

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: { select: { name: true } },
      subscriptionTier: true,
      subscriptionStatus: true,
      billingCycle: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      invoiceCount: true,
      invoiceCountResetAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const usersWithCompanyName = users.map((u) => ({
    ...u,
    companyName: u.company?.name ?? '',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Abonnementen Beheer</h2>
        <p className="text-muted-foreground">
          Overzicht van alle gebruikersabonnementen en hun status
        </p>
      </div>

      <SubscriptionManager users={usersWithCompanyName} />
    </div>
  );
}
