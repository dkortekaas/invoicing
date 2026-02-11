import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import { requireFeature } from '@/lib/auth/subscription-guard';

export default async function NewExpensePage() {
  await requireFeature('expenses');

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has KOR enabled and OCR access in parallel
  const [fiscalSettings, hasOcrAccess] = await Promise.all([
    db.fiscalSettings.findUnique({
      where: { userId: session.user.id },
      select: { useKOR: true },
    }),
    hasFeatureAccess(session.user.id, 'ocr_extraction'),
  ]);

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
          <ExpenseForm useKOR={useKOR} hasOcrAccess={hasOcrAccess} />
        </CardContent>
      </Card>
    </div>
  );
}
