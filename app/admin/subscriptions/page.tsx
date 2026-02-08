import { requireSuperuser } from '@/lib/auth/admin-guard';
import { db } from '@/lib/db';
import { SubscriptionManager } from '@/components/admin/subscription-manager';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

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
      <AdminPageHeader
        title="Abonnementen Beheer"
        subtitle="Overzicht van alle gebruikersabonnementen en hun status"
      />

      <SubscriptionManager users={usersWithCompanyName} />
    </div>
  );
}
