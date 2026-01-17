import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { RecurringForm } from '@/components/recurring/recurring-form';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NieuwAbonnementPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const customers = await db.customer.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      companyName: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nieuw Abonnement</h2>
        <p className="text-muted-foreground">
          Maak een nieuwe terugkerende factuur aan
        </p>
      </div>

      <RecurringForm customers={customers} />
    </div>
  );
}
