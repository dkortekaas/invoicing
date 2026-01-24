import { resend, EMAIL_CONFIG } from './client';
import PaymentConfirmationEmail from '@/emails/payment-confirmation-email';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { render } from '@react-email/render';

interface SendPaymentConfirmationParams {
  invoiceId: string;
  preview?: boolean;
}

export async function sendPaymentConfirmation({ 
  invoiceId,
  preview = false,
}: SendPaymentConfirmationParams) {
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

  if (!invoice.paidAt) {
    throw new Error('Factuur heeft geen betaaldatum');
  }

  const emailProps = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    total: new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(invoice.total)),
    paymentDate: format(invoice.paidAt, 'dd MMMM yyyy', { locale: nl }),
    companyName: invoice.user.company?.name ?? "",
  };

  // Preview mode
  if (preview) {
    const html = await render(PaymentConfirmationEmail(emailProps));
    return { html, email: invoice.customer.email };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: invoice.customer.email,
    subject: `Betalingsbevestiging factuur ${invoice.invoiceNumber}`,
    react: PaymentConfirmationEmail(emailProps),
  });

  if (error) {
    await db.emailLog.create({
      data: {
        invoiceId: invoice.id,
        type: 'PAYMENT_RECEIVED',
        recipient: invoice.customer.email,
        subject: `Betalingsbevestiging factuur ${invoice.invoiceNumber}`,
        status: 'FAILED',
        error: error.message,
      },
    });

    throw new Error(`Betalingsbevestiging verzenden mislukt: ${error.message}`);
  }

  await db.emailLog.create({
    data: {
      invoiceId: invoice.id,
      type: 'PAYMENT_RECEIVED',
      recipient: invoice.customer.email,
      subject: `Betalingsbevestiging factuur ${invoice.invoiceNumber}`,
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
    },
  });

  return { success: true, emailId: data?.id };
}
