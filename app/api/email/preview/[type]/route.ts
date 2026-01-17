import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email/send-invoice';
import { sendReminderEmail } from '@/lib/email/send-reminder';
import { sendPaymentConfirmation } from '@/lib/email/send-payment-confirmation';
import { getCurrentUserId } from '@/lib/server-utils';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { type } = await params;
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is vereist' },
        { status: 400 }
      );
    }

    // Verify invoice belongs to user
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factuur niet gevonden' },
        { status: 404 }
      );
    }

    let html: string;

    if (type === 'invoice') {
      const result = await sendInvoiceEmail({ 
        invoiceId, 
        preview: true 
      });
      if (!result.html) {
        throw new Error('Failed to generate email preview');
      }
      html = result.html;
    } else if (type === 'reminder') {
      const reminderType = searchParams.get('reminderType') || 'first';
      const result = await sendReminderEmail({ 
        invoiceId, 
        reminderType: reminderType as 'friendly' | 'first' | 'second' | 'final',
        preview: true 
      });
      if (!result.html) {
        throw new Error('Failed to generate email preview');
      }
      html = result.html;
    } else if (type === 'payment-confirmation') {
      const result = await sendPaymentConfirmation({ 
        invoiceId,
        preview: true 
      });
      if (!result.html) {
        throw new Error('Failed to generate email preview');
      }
      html = result.html;
    } else {
      return NextResponse.json(
        { error: 'Ongeldig email type' },
        { status: 400 }
      );
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview laden mislukt' },
      { status: 500 }
    );
  }
}
