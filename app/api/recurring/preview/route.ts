import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateRecurringInvoice } from '@/lib/recurring/generator';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recurringInvoiceId, invoiceDate } = body;

    const preview = await generateRecurringInvoice({
      recurringInvoiceId,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      preview: true,
    });

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Preview invoice error:', error);
    return NextResponse.json(
      { error: 'Preview laden mislukt' },
      { status: 500 }
    );
  }
}
