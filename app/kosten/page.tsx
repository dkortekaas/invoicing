import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/import-export';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { redirect } from 'next/navigation';
import { SearchForm } from './search-form';
import { YearFilterSelect } from '@/components/year-filter-select';

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

const SORT_KEYS = ['date', 'description', 'category', 'amount', 'vatAmount'] as const;
type SortKey = (typeof SORT_KEYS)[number];

function isValidSortKey(s: string | null): s is SortKey {
  return s != null && SORT_KEYS.includes(s as SortKey);
}

interface ExpensesPageProps {
  searchParams: Promise<{ search?: string; year?: string; sortBy?: string; sortOrder?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const search = params.search ?? '';
  const yearParam = params.year ? parseInt(params.year, 10) : null;
  const sortBy = isValidSortKey(params.sortBy) ? params.sortBy : 'date';
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

  const where: { userId: string; date?: { gte: Date; lte: Date } } = {
    userId: session.user.id,
  };
  if (yearParam && !Number.isNaN(yearParam)) {
    where.date = {
      gte: new Date(yearParam, 0, 1),
      lte: new Date(yearParam, 11, 31, 23, 59, 59, 999),
    };
  }

  let expenses = await db.expense.findMany({
    where,
    include: {
      customer: true,
      project: true,
    },
    orderBy: { date: 'desc' },
  });

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    expenses = expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        (CATEGORY_LABELS[e.category] ?? e.category).toLowerCase().includes(q) ||
        e.customer?.name?.toLowerCase().includes(q) ||
        e.customer?.companyName?.toLowerCase().includes(q)
    );
  }

  expenses = [...expenses].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'date':
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'description':
        cmp = a.description.localeCompare(b.description);
        break;
      case 'category':
        cmp = (CATEGORY_LABELS[a.category] ?? a.category).localeCompare(
          CATEGORY_LABELS[b.category] ?? b.category
        );
        break;
      case 'amount':
        cmp = Number(a.amount) - Number(b.amount);
        break;
      case 'vatAmount':
        cmp = Number(a.vatAmount) - Number(b.vatAmount);
        break;
      default:
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const allYears = await db.expense
    .findMany({
      where: { userId: session.user.id },
      select: { date: true },
    })
    .then((rows) => {
      const years = new Set(rows.map((r) => new Date(r.date).getFullYear()));
      return Array.from(years).sort((a, b) => b - a);
    });
  const yearsList = allYears.length > 0 ? allYears : [new Date().getFullYear()];

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
        <div className="flex gap-2">
          <ExportButton entityType="EXPENSES" totalCount={expenses.length} />
          <Button asChild>
            <Link href="/kosten/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe uitgave
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchForm />
            <YearFilterSelect years={yearsList} currentYear={params.year ?? null} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="date">Datum</SortableTableHead>
                <SortableTableHead sortKey="description">Beschrijving</SortableTableHead>
                <SortableTableHead sortKey="category">Categorie</SortableTableHead>
                <SortableTableHead sortKey="amount" className="text-right">
                  Bedrag
                </SortableTableHead>
                <SortableTableHead sortKey="vatAmount" className="text-right">
                  BTW
                </SortableTableHead>
                <TableHead>Aftrekbaar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nog geen uitgaven geregistreerd
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/kosten/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe uitgave
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'dd-MM-yyyy', { locale: nl })}</TableCell>
                    <TableCell>
                      <Link href={`/kosten/${expense.id}`} className="hover:underline">
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
