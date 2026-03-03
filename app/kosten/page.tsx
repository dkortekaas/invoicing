import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, FileCheck, FileX } from 'lucide-react';
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
import { T } from '@/components/t';
import { SearchForm } from './search-form';
import { YearFilterSelect } from '@/components/year-filter-select';
import { Pagination } from '@/components/ui/pagination';
import { requireFeature } from '@/lib/auth/subscription-guard';
import { getServerT } from '@/lib/i18n';

const PAGE_SIZE = 50;

const SORT_KEYS = ['date', 'description', 'category', 'amount', 'vatAmount'] as const;
type SortKey = (typeof SORT_KEYS)[number];

function isValidSortKey(s: string | null | undefined): s is SortKey {
  return s != null && SORT_KEYS.includes(s as SortKey);
}

interface ExpensesPageProps {
  searchParams: Promise<{ search?: string; year?: string; sortBy?: string; sortOrder?: string; page?: string }>;
}

const EXPENSE_CATEGORIES = [
  'OFFICE', 'TRAVEL', 'EQUIPMENT', 'SOFTWARE', 'MARKETING', 'EDUCATION',
  'INSURANCE', 'ACCOUNTANT', 'TELECOM', 'UTILITIES', 'RENT', 'MAINTENANCE',
  'PROFESSIONAL', 'OTHER',
] as const;

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  await requireFeature('expenses');

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const t = await getServerT('expensesPage');
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    EXPENSE_CATEGORIES.map((cat) => [cat, t(`categories.${cat}`)])
  );

  const params = await searchParams;
  const currentYearNum = new Date().getFullYear();
  const search = params.search ?? '';
  const yearParam = params.year === 'all' ? null : (params.year ? parseInt(params.year, 10) : currentYearNum);
  const sortBy = isValidSortKey(params.sortBy) ? params.sortBy : 'date';
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

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

  // Pagination
  const totalItems = expenses.length;
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold"><T ns="expensesPage" k="title" /></h1>
          <p className="text-muted-foreground">
            <T ns="expensesPage" k="description" />
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton entityType="EXPENSES" totalCount={expenses.length} />
          <Button asChild>
            <Link href="/kosten/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              <T ns="expensesPage" k="newExpense" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchForm />
            <YearFilterSelect years={yearsList} currentYear={params.year === 'all' ? 'all' : (params.year ?? String(currentYearNum))} />
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="date"><T ns="expensesPage" k="colDate" /></SortableTableHead>
                <SortableTableHead sortKey="description"><T ns="expensesPage" k="colDescription" /></SortableTableHead>
                <SortableTableHead sortKey="category"><T ns="expensesPage" k="colCategory" /></SortableTableHead>
                <SortableTableHead sortKey="amount" className="text-right">
                  <T ns="expensesPage" k="colAmount" />
                </SortableTableHead>
                <SortableTableHead sortKey="vatAmount" className="text-right">
                  <T ns="expensesPage" k="colVat" />
                </SortableTableHead>
                <TableHead className="text-center"><T ns="expensesPage" k="colReceipt" /></TableHead>
                <TableHead><T ns="expensesPage" k="colDeductible" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      <T ns="expensesPage" k="noExpenses" />
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/kosten/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        <T ns="expensesPage" k="newExpense" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense) => (
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
                    <TableCell className="text-center">
                      {expense.receipt ? (
                        <span className="inline-flex items-center gap-1 text-green-600" title="Factuur/bon aanwezig">
                          <FileCheck className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:inline"><T ns="expensesPage" k="receiptYes" /></span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600" title="Geen factuur geüpload – bewaar de bon">
                          <FileX className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:inline"><T ns="expensesPage" k="receiptNo" /></span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.deductible ? (
                        <Badge variant="default">{Number(expense.deductiblePerc)}%</Badge>
                      ) : (
                        <Badge variant="secondary"><T ns="expensesPage" k="deductibleNo" /></Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4">
            <Pagination
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
