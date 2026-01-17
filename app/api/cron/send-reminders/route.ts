import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendReminderEmail } from '@/lib/email/send-reminder';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Haal settings op voor gebruikers met auto-send enabled
    const settings = await db.emailSettings.findMany({
      where: { autoSendReminders: true },
      include: { user: true },
    });

    const results = [];

    for (const setting of settings) {
      // Zoek facturen die een reminder nodig hebben
      const invoices = await db.invoice.findMany({
        where: {
          userId: setting.userId,
          status: { in: ['SENT', 'OVERDUE'] },
          paidAt: null,
        },
        include: {
          emails: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      for (const invoice of invoices) {
        const daysUntilDue = differenceInDays(invoice.dueDate, new Date());
        const daysPastDue = -daysUntilDue;

        let shouldSend = false;
        let reminderType: 'friendly' | 'first' | 'second' | 'final' | null = null;

        // Check welke reminder type verstuurd moet worden
        if (daysUntilDue === Math.abs(setting.friendlyReminderDays)) {
          shouldSend = true;
          reminderType = 'friendly';
        } else if (daysPastDue === setting.firstReminderDays) {
          shouldSend = true;
          reminderType = 'first';
        } else if (daysPastDue === setting.secondReminderDays) {
          shouldSend = true;
          reminderType = 'second';
        } else if (daysPastDue === setting.finalReminderDays) {
          shouldSend = true;
          reminderType = 'final';
        }

        // Check if this reminder type was already sent
        if (shouldSend && reminderType) {
          const lastEmail = invoice.emails[0];
          const reminderTypeMap = {
            friendly: 'REMINDER_FRIENDLY',
            first: 'REMINDER_FIRST',
            second: 'REMINDER_SECOND',
            final: 'REMINDER_FINAL',
          };

          // Skip if this reminder type was already sent
          if (lastEmail?.type === reminderTypeMap[reminderType]) {
            continue;
          }

          try {
            await sendReminderEmail({
              invoiceId: invoice.id,
              reminderType,
            });
            results.push({ invoiceId: invoice.id, reminderType, success: true });
          } catch (error) {
            results.push({ 
              invoiceId: invoice.id, 
              reminderType, 
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
