import { resend, EMAIL_CONFIG } from './client';
import InvoiceEmail from '@/emails/invoice-email';
import { db } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/invoice-pdf-template';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { render } from '@react-email/render';
import type { InvoiceItem } from '@/types';
import { logInvoiceSent } from '@/lib/audit/helpers';

interface SendInvoiceEmailParams {
  invoiceId: string;
  preview?: boolean; // Voor preview zonder versturen
}

export async function sendInvoiceEmail({ 
  invoiceId, 
  preview = false 
}: SendInvoiceEmailParams) {
  // Haal factuur op met alle relaties
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      user: true,
    },
  });

  if (!invoice) {
    throw new Error('Factuur niet gevonden');
  }

  if (!invoice.customer.email) {
    throw new Error('Klant heeft geen e-mailadres');
  }

  // Format data voor email template
  const emailProps = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: format(invoice.invoiceDate, 'dd MMMM yyyy', { locale: nl }),
    dueDate: format(invoice.dueDate, 'dd MMMM yyyy', { locale: nl }),
    total: new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(invoice.total)),
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(item.unitPrice)),
      total: new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(item.total)),
    })),
    companyName: invoice.user.companyName,
    companyEmail: invoice.user.companyEmail,
    companyPhone: invoice.user.companyPhone || undefined,
    reference: invoice.reference || undefined,
    notes: invoice.notes || undefined,
  };

  // Preview mode: return HTML only
  if (preview) {
    const html = await render(InvoiceEmail(emailProps));
    return { html, email: invoice.customer.email };
  }

  // Bereid data voor PDF (zoals in PDF route)
  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    reference: invoice.reference,
    notes: invoice.notes,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    customer: {
      name: invoice.customer.name,
      companyName: invoice.customer.companyName,
      address: invoice.customer.address,
      postalCode: invoice.customer.postalCode,
      city: invoice.customer.city,
      country: invoice.customer.country,
      vatNumber: invoice.customer.vatNumber,
    },
    items: invoice.items.map((item: InvoiceItem) => ({
      description: item.description,
      quantity: item.quantity.toNumber(),
      unit: item.unit,
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
    })),
    company: {
      companyName: invoice.user.companyName,
      companyEmail: invoice.user.companyEmail,
      companyPhone: invoice.user.companyPhone,
      companyAddress: invoice.user.companyAddress,
      companyPostalCode: invoice.user.companyPostalCode,
      companyCity: invoice.user.companyCity,
      companyCountry: invoice.user.companyCountry,
      companyLogo: invoice.user.companyLogo,
      vatNumber: invoice.user.vatNumber,
      kvkNumber: invoice.user.kvkNumber,
      iban: invoice.user.iban,
    },
  };

  // Haal system settings op voor watermerk
  const settings = await db.systemSettings.findUnique({
    where: { id: 'default' },
  });

  // Haal user tier op
  const user = await db.user.findUnique({
    where: { id: invoice.userId },
    select: { subscriptionTier: true },
  });

  // Genereer PDF met watermerk settings
  const pdfBuffer = await renderToBuffer(
    InvoicePDF({ 
      invoice: pdfData,
      watermarkSettings: settings,
      userTier: user?.subscriptionTier || 'FREE',
    })
  );

  // Verstuur email met PDF bijlage
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: invoice.customer.email,
    subject: `Factuur ${invoice.invoiceNumber} van ${invoice.user.companyName}`,
    react: InvoiceEmail(emailProps),
    attachments: [
      {
        filename: `Factuur-${invoice.invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  if (error) {
    // Log failed email
    await db.emailLog.create({
      data: {
        invoiceId: invoice.id,
        type: 'INVOICE',
        recipient: invoice.customer.email,
        subject: `Factuur ${invoice.invoiceNumber}`,
        status: 'FAILED',
        error: error.message,
      },
    });

    throw new Error(`Email verzenden mislukt: ${error.message}`);
  }

  // Log successful email
  await db.emailLog.create({
    data: {
      invoiceId: invoice.id,
      type: 'INVOICE',
      recipient: invoice.customer.email,
      subject: `Factuur ${invoice.invoiceNumber}`,
      status: 'SENT',
      resendId: data?.id,
      sentAt: new Date(),
    },
  });

  // Update invoice
  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      sentAt: new Date(),
      emailsSentCount: { increment: 1 },
      lastEmailSentAt: new Date(),
      status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
    },
  });

  // Log audit trail
  await logInvoiceSent(invoice.id, invoice.customer.email, invoice.userId);

  return { success: true, emailId: data?.id };
}
