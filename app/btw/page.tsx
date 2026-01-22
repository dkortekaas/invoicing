import { Suspense } from 'react';
import { db, clearPrismaCache } from '@/lib/db';
import { auth } from '@/lib/auth';
import { VATDashboard } from '@/components/vat/vat-dashboard';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { getCurrentQuarter, getPreviousQuarter } from '@/lib/vat/calculations';

export default async function BTWPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Clear Prisma cache to ensure we have the latest models after migrations
  if (process.env.NODE_ENV !== 'production') {
    clearPrismaCache();
  }

  const current = getCurrentQuarter();
  const prev1 = getPreviousQuarter(current.year, current.quarter);
  const prev2 = getPreviousQuarter(prev1.year, prev1.quarter);

  // Load last 3 quarters
  const quarters = [current, prev1, prev2];
  
  const reports = await Promise.all(
    quarters.map(async (q) => {
      try {
        const report = await db.vATReport.findUnique({
          where: {
            userId_year_quarter: {
              userId: session.user.id,
              year: q.year,
              quarter: q.quarter,
            },
          },
        });

        return {
          year: q.year,
          quarter: q.quarter,
          label: `Q${q.quarter} ${q.year}`,
          vatBalance: report ? Number(report.vatBalance) : 0,
          status: report?.status || 'DRAFT' as const,
          totalRevenue: report ? Number(report.totalRevenue) : 0,
          totalExpenses: report ? Number(report.totalExpenses) : 0,
        };
      } catch (error) {
        console.error('Error loading VAT report:', error);
        return {
          year: q.year,
          quarter: q.quarter,
          label: `Q${q.quarter} ${q.year}`,
          vatBalance: 0,
          status: 'DRAFT' as const,
          totalRevenue: 0,
          totalExpenses: 0,
        };
      }
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BTW Rapportage</h1>
          <p className="text-muted-foreground">
            Overzicht BTW aangiftes en voorbelasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/kosten">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Kosten
            </Link>
          </Button>
          <Button asChild>
            <Link href="/kosten/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe uitgave
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div>Laden...</div>}>
        <VATDashboard quarters={reports} currentQuarter={current} />
      </Suspense>
    </div>
  );
}
