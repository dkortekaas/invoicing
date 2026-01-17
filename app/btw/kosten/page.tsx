import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { redirect } from 'next/navigation';

const CATEGORY_LABELS: Record<string, string> = {
  OFFICE: 'Kantoorkosten',
  TRAVEL: 'Reiskosten',
  EQUIPMENT: 'Apparatuur',
  SOFTWARE: 'Software/Subscriptions',
  MARKETING: 'Marketing',
  EDUCATION: 'Opleiding',
  INSURANCE: 'Verzekeringen',
  ACCOUNTANT: 'Accountant',
  TELECOM: 'Telefoon/Internet',
  UTILITIES: 'Energie',
  RENT: 'Huur',
  MAINTENANCE: 'Onderhoud',
  PROFESSIONAL: 'Professionele diensten',
  OTHER: 'Overig',
};

export default async function ExpensesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const expenses = await db.expense.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      customer: true,
      project: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 50, // Limit to last 50
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kosten</h1>
          <p className="text-muted-foreground">
            Overzicht van alle uitgaven en voorbelasting
          </p>
        </div>
        <Button asChild>
          <Link href="/btw/kosten/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe uitgave
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">BTW</TableHead>
                <TableHead>Aftrekbaar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nog geen uitgaven geregistreerd
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'dd-MM-yyyy', { locale: nl })}</TableCell>
                    <TableCell>
                      <Link href={`/btw/kosten/${expense.id}`} className="hover:underline">
                        {expense.description}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(expense.amount))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(expense.vatAmount))}</TableCell>
                    <TableCell>
                      {expense.deductible ? (
                        <Badge variant="default">{Number(expense.deductiblePerc)}%</Badge>
                      ) : (
                        <Badge variant="secondary">Nee</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
