import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function NewExpensePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has KOR enabled
  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId: session.user.id },
    select: { useKOR: true },
  });

  const useKOR = fiscalSettings?.useKOR ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nieuwe uitgave</h1>
        <p className="text-muted-foreground">
          Voeg een nieuwe uitgave toe voor BTW voorbelasting
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uitgave details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm useKOR={useKOR} />
        </CardContent>
      </Card>
    </div>
  );
}
