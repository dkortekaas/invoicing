import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { RecurringList } from '@/components/recurring/recurring-list';
import { RecurringStats } from '@/components/recurring/recurring-stats';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { calculateMRR } from '@/lib/recurring/calculations';

export const dynamic = 'force-dynamic';

export default async function AbonnementenPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const recurring = await db.recurringInvoice.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      customer: true,
      items: true,
      _count: {
        select: {
          invoices: true,
        },
      },
    },
    orderBy: {
      nextDate: 'asc',
    },
  });

  // Bereken stats
  const activeRecurring = recurring.filter(r => r.status === 'ACTIVE');
  
  let totalMRR = 0;
  activeRecurring.forEach(r => {
    const total = r.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    totalMRR += calculateMRR(total, r.frequency, r.interval);
  });

  const totalARR = totalMRR * 12;
  const uniqueCustomers = new Set(recurring.map(r => r.customerId)).size;

  const stats = {
    totalMRR,
    totalARR,
    activeSubscriptions: activeRecurring.length,
    totalCustomers: uniqueCustomers,
  };

  // Transform data for RecurringList component
  const transformRecurring = (r: typeof recurring[0]) => ({
    ...r,
    items: r.items.map(item => ({
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  });

  const grouped = {
    active: recurring.filter(r => r.status === 'ACTIVE').map(transformRecurring),
    paused: recurring.filter(r => r.status === 'PAUSED').map(transformRecurring),
    ended: recurring.filter(r => r.status === 'ENDED' || r.status === 'CANCELLED').map(transformRecurring),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Abonnementen</h1>
          <p className="text-muted-foreground">
            Beheer terugkerende facturen en retainers
          </p>
        </div>

        <Button asChild>
          <Link href="/abonnementen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw abonnement
          </Link>
        </Button>
      </div>

      <RecurringStats stats={stats} />

      <div className="space-y-6">
        {grouped.active.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Actief</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecurringList recurring={grouped.active} />
            </div>
          </div>
        )}

        {grouped.paused.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Gepauzeerd</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecurringList recurring={grouped.paused} />
            </div>
          </div>
        )}

        {grouped.ended.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Afgelopen</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecurringList recurring={grouped.ended} />
            </div>
          </div>
        )}

        {recurring.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Geen abonnementen</h3>
            <p className="text-muted-foreground mb-4">
              Maak je eerste terugkerende factuur aan
            </p>
            <Button asChild>
              <Link href="/abonnementen/nieuw">
                <Plus className="mr-2 h-4 w-4" />
                Nieuw abonnement
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
