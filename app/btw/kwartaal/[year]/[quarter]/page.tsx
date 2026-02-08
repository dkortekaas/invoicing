import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { VATCalculations } from '@/components/vat/vat-calculations';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getQuarterInfo } from '@/lib/vat/calculations';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { redirect } from 'next/navigation';

export default async function QuarterReportPage({
  params,
}: {
  params: Promise<{ year: string; quarter: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { year: yearStr, quarter: quarterStr } = await params;
  const year = parseInt(yearStr);
  const quarter = parseInt(quarterStr);

  if (isNaN(year) || isNaN(quarter) || quarter < 1 || quarter > 4) {
    redirect('/btw');
  }

  const report = await db.vATReport.findUnique({
    where: {
      userId_year_quarter: {
        userId: session.user.id,
        year,
        quarter,
      },
    },
    include: {
      adjustments: true,
    },
  });

  if (!report) {
    // Generate report if it doesn't exist
    const { saveVATReport } = await import('@/lib/vat/quarters');
    await saveVATReport(session.user.id, year, quarter, 'DRAFT');
    
    // Reload
    const updatedReport = await db.vATReport.findUnique({
      where: {
        userId_year_quarter: {
          userId: session.user.id,
          year,
          quarter,
        },
      },
      include: {
        adjustments: true,
      },
    });

    if (!updatedReport) {
      redirect('/btw');
    }

    const { startDate, endDate, label } = getQuarterInfo(year, quarter);
    const statusConfig = {
      DRAFT: { label: 'Concept', variant: 'secondary' as const },
      FINAL: { label: 'Definitief', variant: 'default' as const },
      FILED: { label: 'Ingediend', variant: 'outline' as const },
    }[updatedReport.status];

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/btw">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{label}</h1>
              <p className="text-muted-foreground">
                {format(startDate, 'dd MMMM', { locale: nl })} - {format(endDate, 'dd MMMM yyyy', { locale: nl })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <Button variant="outline" asChild>
              <a href={`/api/vat/report/${year}/${quarter}/export`} download>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </a>
            </Button>
          </div>
        </div>

        <VATCalculations report={{
          revenueHighRate: Number(updatedReport.revenueHighRate),
          revenueHighVAT: Number(updatedReport.revenueHighVAT),
          revenueLowRate: Number(updatedReport.revenueLowRate),
          revenueLowVAT: Number(updatedReport.revenueLowVAT),
          revenueZeroRate: Number(updatedReport.revenueZeroRate),
          revenueReversed: Number(updatedReport.revenueReversed),
          revenueEU: Number(updatedReport.revenueEU),
          revenueExport: Number(updatedReport.revenueExport),
          expensesHighRate: Number(updatedReport.expensesHighRate),
          expensesHighVAT: Number(updatedReport.expensesHighVAT),
          expensesLowRate: Number(updatedReport.expensesLowRate),
          expensesLowVAT: Number(updatedReport.expensesLowVAT),
          expensesReversed: Number(updatedReport.expensesReversed),
          totalRevenue: Number(updatedReport.totalRevenue),
          totalRevenueVAT: Number(updatedReport.totalRevenueVAT),
          totalExpenses: Number(updatedReport.totalExpenses),
          totalExpensesVAT: Number(updatedReport.totalExpensesVAT),
          vatOwed: Number(updatedReport.vatOwed),
          vatDeductible: Number(updatedReport.vatDeductible),
          vatBalance: Number(updatedReport.vatBalance),
        }} />
      </div>
    );
  }

  const { startDate, endDate, label } = getQuarterInfo(year, quarter);
  const statusConfig = {
    DRAFT: { label: 'Concept', variant: 'secondary' as const },
    FINAL: { label: 'Definitief', variant: 'default' as const },
    FILED: { label: 'Ingediend', variant: 'outline' as const },
  }[report.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/btw">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{label}</h1>
            <p className="text-muted-foreground">
              {format(startDate, 'dd MMMM', { locale: nl })} - {format(endDate, 'dd MMMM yyyy', { locale: nl })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <Button variant="outline" asChild>
            <a href={`/api/vat/report/${year}/${quarter}/export`} download>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </a>
          </Button>
        </div>
      </div>

      <VATCalculations report={{
        revenueHighRate: Number(report.revenueHighRate),
        revenueHighVAT: Number(report.revenueHighVAT),
        revenueLowRate: Number(report.revenueLowRate),
        revenueLowVAT: Number(report.revenueLowVAT),
        revenueZeroRate: Number(report.revenueZeroRate),
        revenueReversed: Number(report.revenueReversed),
        revenueEU: Number(report.revenueEU),
        revenueExport: Number(report.revenueExport),
        expensesHighRate: Number(report.expensesHighRate),
        expensesHighVAT: Number(report.expensesHighVAT),
        expensesLowRate: Number(report.expensesLowRate),
        expensesLowVAT: Number(report.expensesLowVAT),
        expensesReversed: Number(report.expensesReversed),
        totalRevenue: Number(report.totalRevenue),
        totalRevenueVAT: Number(report.totalRevenueVAT),
        totalExpenses: Number(report.totalExpenses),
        totalExpensesVAT: Number(report.totalExpensesVAT),
        vatOwed: Number(report.vatOwed),
        vatDeductible: Number(report.vatDeductible),
        vatBalance: Number(report.vatBalance),
      }} />
    </div>
  );
}
