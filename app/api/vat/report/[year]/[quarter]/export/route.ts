import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { exportVATReportToExcel } from '@/lib/vat/export';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ year: string; quarter: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year: yearStr, quarter: quarterStr } = await params;
  const year = parseInt(yearStr);
  const quarter = parseInt(quarterStr);

  try {
    const report = await db.vATReport.findUnique({
      where: {
        userId_year_quarter: {
          userId: session.user.id,
          year,
          quarter,
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const c = user.company
    const exportData = {
      year,
      quarter,
      company: {
        name: c?.name ?? '',
        vatNumber: user.vatNumber || '',
        address: c ? [c.address, c.postalCode, c.city].filter(Boolean).join(', ') || '' : '',
      },
      revenue: {
        highRate: Number(report.revenueHighRate),
        highVAT: Number(report.revenueHighVAT),
        lowRate: Number(report.revenueLowRate),
        lowVAT: Number(report.revenueLowVAT),
        zeroRate: Number(report.revenueZeroRate),
        reversed: Number(report.revenueReversed),
        eu: Number(report.revenueEU),
        export: Number(report.revenueExport),
      },
      expenses: {
        highRate: Number(report.expensesHighRate),
        highVAT: Number(report.expensesHighVAT),
        lowRate: Number(report.expensesLowRate),
        lowVAT: Number(report.expensesLowVAT),
        reversed: Number(report.expensesReversed),
      },
      totals: {
        revenue: Number(report.totalRevenue),
        revenueVAT: Number(report.totalRevenueVAT),
        expenses: Number(report.totalExpenses),
        expensesVAT: Number(report.totalExpensesVAT),
        vatOwed: Number(report.vatOwed),
        vatDeductible: Number(report.vatDeductible),
        vatBalance: Number(report.vatBalance),
      },
    };

    const buffer = await exportVATReportToExcel(exportData);

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BTW-Aangifte-Q${quarter}-${year}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export VAT report error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
