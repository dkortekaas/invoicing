import { requireSuperuser } from '@/lib/auth/admin-guard';
import { db } from '@/lib/db';
import { UserRoleManager } from '@/components/admin/user-role-manager';

export default async function UsersPage() {
  await requireSuperuser();

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Count invoices per user
  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const invoiceCount = await db.invoice.count({
        where: { userId: user.id },
      });
      return { ...user, invoiceCount };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gebruikers Beheer</h2>
        <p className="text-muted-foreground">
          Beheer gebruikersrollen en bekijk gebruikersstatistieken
        </p>
      </div>

      <UserRoleManager users={usersWithCounts} />
    </div>
  );
}
