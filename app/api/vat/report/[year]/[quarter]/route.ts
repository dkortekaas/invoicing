import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveVATReport } from '@/lib/vat/quarters';

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

  if (isNaN(year) || isNaN(quarter) || quarter < 1 || quarter > 4) {
    return NextResponse.json(
      { error: 'Invalid year or quarter' },
      { status: 400 }
    );
  }

  try {
    // Check if report exists
    let report = await db.vATReport.findUnique({
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

    // If not exists, generate new one
    if (!report) {
      await saveVATReport(session.user.id, year, quarter, 'DRAFT');
      // Reload with adjustments
      report = await db.vATReport.findUnique({
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
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Get VAT report error:', error);
    return NextResponse.json(
      { error: 'Failed to get report' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { status = 'DRAFT' } = body;

    const report = await saveVATReport(session.user.id, year, quarter, status);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Save VAT report error:', error);
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
}
