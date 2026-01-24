import { resend, EMAIL_CONFIG } from './client';
import ReminderEmail from '@/emails/reminder-email';
import { db } from '@/lib/db';
import { format, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { render } from '@react-email/render';
import type { EmailType } from '@/types';

interface SendReminderEmailParams {
  invoiceId: string;
  reminderType: 'friendly' | 'first' | 'second' | 'final';
  preview?: boolean;
}

const REMINDER_TYPE_MAP: Record<string, EmailType> = {
  friendly: 'REMINDER_FRIENDLY',
  first: 'REMINDER_FIRST',
  second: 'REMINDER_SECOND',
  final: 'REMINDER_FINAL',
};

export async function sendReminderEmail({ 
  invoiceId, 
  reminderType,
  preview = false,
}: SendReminderEmailParams) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      user: { include: { company: true } },
    },
  });

  if (!invoice) {
    throw new Error('Factuur niet gevonden');
  }

  if (!invoice.customer.email) {
    throw new Error('Klant heeft geen e-mailadres');
  }

  if (invoice.status === 'PAID') {
    throw new Error('Factuur is al betaald');
  }

  const daysOverdue = differenceInDays(new Date(), invoice.dueDate);

  const emailProps = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: format(invoice.invoiceDate, 'dd MMMM yyyy', { locale: nl }),
    dueDate: format(invoice.dueDate, 'dd MMMM yyyy', { locale: nl }),
    total: new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(invoice.total)),
    daysOverdue,
    reminderType,
    companyName: invoice.user.company?.name ?? "",
    companyEmail: invoice.user.company?.email ?? "",
    companyPhone: invoice.user.company?.phone || undefined,
  };

  const subject = {
    friendly: `Aanstaande vervaldatum factuur ${invoice.invoiceNumber}`,
    first: `Herinnering betaling factuur ${invoice.invoiceNumber}`,
    second: `Tweede herinnering factuur ${invoice.invoiceNumber}`,
    final: `Finale herinnering - ${invoice.invoiceNumber}`,
  }[reminderType];

  // Preview mode
  if (preview) {
    const html = await render(ReminderEmail(emailProps));
    return { html, email: invoice.customer.email };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: invoice.customer.email,
    subject,
    react: ReminderEmail(emailProps),
  });

  if (error) {
    const emailType = REMINDER_TYPE_MAP[reminderType];
    if (!emailType) {
      throw new Error(`Invalid reminder type: ${reminderType}`);
    }
    await db.emailLog.create({
      data: {
        invoiceId: invoice.id,
        type: emailType,
        recipient: invoice.customer.email,
        subject,
        status: 'FAILED',
        error: error.message,
      },
    });

    throw new Error(`Herinnering verzenden mislukt: ${error.message}`);
  }

  const emailType = REMINDER_TYPE_MAP[reminderType];
  if (!emailType) {
    throw new Error(`Invalid reminder type: ${reminderType}`);
  }
  await db.emailLog.create({
    data: {
      invoiceId: invoice.id,
      type: emailType,
      recipient: invoice.customer.email,
      subject,
      status: 'SENT',
      resendId: data?.id,
      sentAt: new Date(),
    },
  });

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      emailsSentCount: { increment: 1 },
      lastEmailSentAt: new Date(),
      status: daysOverdue > 0 ? 'OVERDUE' : invoice.status,
    },
  });

  return { success: true, emailId: data?.id };
}
