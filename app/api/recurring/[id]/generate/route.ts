import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateRecurringInvoice } from '@/lib/recurring/generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { invoiceDate, sendEmail = false } = body;

    const invoice = await generateRecurringInvoice({
      recurringInvoiceId: id,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      sendEmail,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Genereren mislukt' },
      { status: 500 }
    );
  }
}
