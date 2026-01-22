import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewExpensePage() {
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
          <ExpenseForm />
        </CardContent>
      </Card>
    </div>
  );
}
