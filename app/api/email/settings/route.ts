import { NextRequest, NextResponse } from 'next/server';
import { updateEmailSettings } from '@/app/instellingen/actions';
import { z } from 'zod';

const emailSettingsSchema = z.object({
  autoSendInvoice: z.boolean(),
  autoSendReminders: z.boolean(),
  autoSendPaymentConfirm: z.boolean(),
  friendlyReminderDays: z.number().int().min(-30).max(0),
  firstReminderDays: z.number().int().min(0).max(365),
  secondReminderDays: z.number().int().min(0).max(365),
  finalReminderDays: z.number().int().min(0).max(365),
  emailSignature: z.string().optional(),
  invoiceEmailCc: z.string().email().optional().or(z.literal('')),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = emailSettingsSchema.parse(body);

    await updateEmailSettings({
      ...validated,
      invoiceEmailCc: validated.invoiceEmailCc || undefined,
      emailSignature: validated.emailSignature || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email settings error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ongeldige gegevens', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Instellingen opslaan mislukt' },
      { status: 500 }
    );
  }
}
