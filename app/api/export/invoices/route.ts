import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exportInvoices } from '@/lib/import-export/export-service';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const {
      format: fileFormat = 'xlsx',
      filters,
      columns,
      options,
    } = body;

    const buffer = await exportInvoices(session.user.id, {
      format: fileFormat,
      filters,
      columns,
      options,
    });

    const date = format(new Date(), 'yyyy-MM-dd');
    const extension = fileFormat === 'xlsx' ? 'xlsx' : 'csv';
    const contentType =
      fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="facturen-export-${date}.${extension}"`,
      },
    });
  } catch (error) {
    console.error('Export invoices error:', error);
    return NextResponse.json(
      { error: 'Export mislukt' },
      { status: 500 }
    );
  }
}
