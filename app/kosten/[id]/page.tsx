import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const expense = await db.expense.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!expense) {
    redirect('/kosten');
  }

  // Convert Decimal fields to numbers for Client Component serialization
  const serializedExpense = {
    ...expense,
    amount: expense.amount.toNumber(),
    vatAmount: expense.vatAmount.toNumber(),
    vatRate: expense.vatRate.toNumber(),
    netAmount: expense.netAmount.toNumber(),
    deductiblePerc: expense.deductiblePerc.toNumber(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uitgave bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk uitgave details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uitgave details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm expense={serializedExpense} />
        </CardContent>
      </Card>
    </div>
  );
}
