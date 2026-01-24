import { resend, EMAIL_CONFIG } from './client';
import CreditNoteEmail from '@/emails/credit-note-email';
import { db } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { CreditNotePDF } from '@/components/creditnotes/credit-note-pdf-template';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { render } from '@react-email/render';
import { CREDIT_NOTE_REASON_LABELS } from '@/lib/utils';
import { logCreditNoteSent } from '@/lib/audit/helpers';

interface CreditNoteItem {
  description: string;
  quantity: { toNumber(): number };
  unitPrice: { toNumber(): number };
  vatRate: { toNumber(): number };
  subtotal: { toNumber(): number };
  unit: string;
}

interface SendCreditNoteEmailParams {
  creditNoteId: string;
  preview?: boolean; // Voor preview zonder versturen
}

export async function sendCreditNoteEmail({
  creditNoteId,
  preview = false
}: SendCreditNoteEmailParams) {
  // Haal credit nota op met alle relaties
  const creditNote = await db.creditNote.findUnique({
    where: { id: creditNoteId },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      user: {
        select: {
          vatNumber: true,
          kvkNumber: true,
          iban: true,
          company: true,
        },
      },
    },
  });

  if (!creditNote) {
    throw new Error('Credit nota niet gevonden');
  }

  if (!creditNote.customer.email) {
    throw new Error('Klant heeft geen e-mailadres');
  }

  const reasonLabel = CREDIT_NOTE_REASON_LABELS[creditNote.reason] || creditNote.reason;

  // Format data voor email template
  const emailProps = {
    customerName: creditNote.customer.name,
    creditNoteNumber: creditNote.creditNoteNumber,
    creditNoteDate: format(creditNote.creditNoteDate, 'dd MMMM yyyy', { locale: nl }),
    total: new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(creditNote.total)),
    reason: reasonLabel,
    reasonDescription: creditNote.description || undefined,
    originalInvoiceNumber: creditNote.originalInvoiceNumber || undefined,
    items: creditNote.items.map((item: CreditNoteItem) => ({
      description: item.description,
      quantity: item.quantity.toNumber().toString(),
      unitPrice: new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(item.unitPrice.toNumber()),
      total: new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(item.subtotal.toNumber()),
    })),
    companyName: creditNote.user.company?.name ?? "",
    companyEmail: creditNote.user.company?.email ?? "",
    companyPhone: creditNote.user.company?.phone || undefined,
    notes: creditNote.notes || undefined,
  };

  // Preview mode: return HTML only
  if (preview) {
    const html = await render(CreditNoteEmail(emailProps));
    return { html, email: creditNote.customer.email };
  }

  // Bereid data voor PDF
  const pdfData = {
    creditNoteNumber: creditNote.creditNoteNumber,
    creditNoteDate: creditNote.creditNoteDate,
    reason: creditNote.reason,
    description: creditNote.description,
    notes: creditNote.notes,
    originalInvoiceNumber: creditNote.originalInvoiceNumber,
    subtotal: creditNote.subtotal.toNumber(),
    vatAmount: creditNote.vatAmount.toNumber(),
    total: creditNote.total.toNumber(),
    customer: {
      name: creditNote.customer.name,
      companyName: creditNote.customer.companyName,
      address: creditNote.customer.address,
      postalCode: creditNote.customer.postalCode,
      city: creditNote.customer.city,
      country: creditNote.customer.country,
      vatNumber: creditNote.customer.vatNumber,
    },
    items: creditNote.items.map((item: CreditNoteItem) => ({
      description: item.description,
      quantity: item.quantity.toNumber(),
      unit: item.unit,
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
    })),
    company: {
      companyName: creditNote.user.company?.name ?? "",
      companyEmail: creditNote.user.company?.email ?? "",
      companyPhone: creditNote.user.company?.phone ?? null,
      companyAddress: creditNote.user.company?.address ?? "",
      companyPostalCode: creditNote.user.company?.postalCode ?? "",
      companyCity: creditNote.user.company?.city ?? "",
      companyCountry: creditNote.user.company?.country ?? "Nederland",
      companyLogo: creditNote.user.company?.logo ?? null,
      vatNumber: creditNote.user.vatNumber,
      kvkNumber: creditNote.user.kvkNumber,
      iban: creditNote.user.iban,
    },
  };

  // Haal system settings op voor watermerk
  const settings = await db.systemSettings.findUnique({
    where: { id: 'default' },
  });

  // Haal user tier op
  const user = await db.user.findUnique({
    where: { id: creditNote.userId },
    select: { subscriptionTier: true },
  });

  // Genereer PDF met watermerk settings
  const pdfBuffer = await renderToBuffer(
    CreditNotePDF({
      creditNote: pdfData,
      watermarkSettings: settings,
      userTier: user?.subscriptionTier || 'FREE',
    })
  );

  // Verstuur email met PDF bijlage
  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: creditNote.customer.email,
    subject: `Credit Nota ${creditNote.creditNoteNumber} van ${creditNote.user.company?.name ?? "Ons"}`,
    react: CreditNoteEmail(emailProps),
    attachments: [
      {
        filename: `CreditNota-${creditNote.creditNoteNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  if (error) {
    // Log failed email
    await db.creditNoteEmailLog.create({
      data: {
        creditNoteId: creditNote.id,
        type: 'CREDIT_NOTE',
        recipient: creditNote.customer.email,
        subject: `Credit Nota ${creditNote.creditNoteNumber}`,
        status: 'FAILED',
        error: error.message,
      },
    });

    throw new Error(`Email verzenden mislukt: ${error.message}`);
  }

  // Log successful email
  await db.creditNoteEmailLog.create({
    data: {
      creditNoteId: creditNote.id,
      type: 'CREDIT_NOTE',
      recipient: creditNote.customer.email,
      subject: `Credit Nota ${creditNote.creditNoteNumber}`,
      status: 'SENT',
      resendId: data?.id,
      sentAt: new Date(),
    },
  });

  // Update credit note
  await db.creditNote.update({
    where: { id: creditNote.id },
    data: {
      sentAt: new Date(),
      emailsSentCount: { increment: 1 },
      lastEmailSentAt: new Date(),
      status: creditNote.status === 'DRAFT' || creditNote.status === 'FINAL' ? 'SENT' : creditNote.status,
    },
  });

  // Log audit trail
  await logCreditNoteSent(creditNote.id, creditNote.customer.email, creditNote.userId);

  return { success: true, emailId: data?.id };
}
