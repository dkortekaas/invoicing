import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email/send-invoice';
import { sendReminderEmail } from '@/lib/email/send-reminder';
import { sendPaymentConfirmation } from '@/lib/email/send-payment-confirmation';
import { getCurrentUserId } from '@/lib/server-utils';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    const body = await request.json();
    const { invoiceId, type, reminderType } = body;

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

    let result;

    if (type === 'invoice') {
      result = await sendInvoiceEmail({ invoiceId });
    } else if (type === 'reminder') {
      if (!reminderType) {
        return NextResponse.json(
          { error: 'Reminder type is vereist' },
          { status: 400 }
        );
      }
      result = await sendReminderEmail({ invoiceId, reminderType });
    } else if (type === 'payment-confirmation') {
      result = await sendPaymentConfirmation({ invoiceId });
    } else {
      return NextResponse.json(
        { error: 'Ongeldig email type' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email verzenden mislukt' },
      { status: 500 }
    );
  }
}
