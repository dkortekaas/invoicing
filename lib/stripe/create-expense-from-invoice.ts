import Stripe from 'stripe';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe/client';
import { calculateNetFromGross, calculateVATFromGross } from '@/lib/vat/calculations';
import { ExpenseCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';

const SUBSCRIPTION_SUPPLIER = 'Stripe';
const SUBSCRIPTION_CATEGORY: ExpenseCategory = 'SOFTWARE';
const VAT_RATE = 21; // 21% BTW voor abonnementen

/**
 * Download Stripe invoice PDF and upload to Vercel Blob. Returns blob URL or null.
 */
async function uploadInvoicePdfToBlob(
  invoicePdfUrl: string,
  userId: string,
  invoiceId: string
): Promise<string | null> {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return null;

    const response = await fetch(invoicePdfUrl, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { put } = await import('@vercel/blob');
    const filename = `receipts/stripe-invoice-${userId}-${invoiceId}.pdf`;
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
    });
    return blob.url;
  } catch {
    return null;
  }
}

/**
 * Create a kosten (expense) from a paid Stripe subscription invoice, with the invoice PDF as receipt.
 * Called from invoice.paid webhook for both initial subscription and monthly renewals.
 */
/** Returns true if an expense was created, false if skipped (e.g. already exists). */
export async function createExpenseFromStripeInvoice(
  invoice: Stripe.Invoice,
  userId: string
): Promise<boolean> {
  if (!invoice.id || invoice.amount_paid == null || invoice.amount_paid <= 0) return false;

  const invoiceNumber = invoice.number ?? invoice.id;
  const existing = await db.expense.findFirst({
    where: {
      userId,
      supplier: SUBSCRIPTION_SUPPLIER,
      invoiceNumber,
    },
  });
  if (existing) return false;

  const amountGross = invoice.amount_paid / 100;
  const netAmount = calculateNetFromGross(amountGross, VAT_RATE);
  const vatAmount = calculateVATFromGross(amountGross, VAT_RATE);

  const paidAt =
    invoice.status_transitions?.paid_at != null
      ? invoice.status_transitions.paid_at * 1000
      : invoice.created * 1000;
  const expenseDate = new Date(paidAt);

  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : expenseDate;
  const monthYear = periodEnd.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  const description = `Declair abonnement - ${monthYear}`;

  let receiptUrl: string | null = null;
  let invoicePdfUrl: string | null =
    typeof invoice.invoice_pdf === 'string' ? invoice.invoice_pdf : null;
  if (!invoicePdfUrl) {
    try {
      const full = await stripe.invoices.retrieve(invoice.id);
      invoicePdfUrl = typeof full.invoice_pdf === 'string' ? full.invoice_pdf : null;
    } catch {
      invoicePdfUrl = null;
    }
  }
  if (invoicePdfUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    receiptUrl = await uploadInvoicePdfToBlob(invoicePdfUrl, userId, invoice.id);
  }

  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
    select: { useKOR: true },
  });
  const useKOR = fiscalSettings?.useKOR ?? false;

  await db.expense.create({
    data: {
      userId,
      date: expenseDate,
      description,
      category: SUBSCRIPTION_CATEGORY,
      amount: new Prisma.Decimal(amountGross),
      vatRate: new Prisma.Decimal(VAT_RATE),
      netAmount: new Prisma.Decimal(netAmount),
      vatAmount: new Prisma.Decimal(vatAmount),
      supplier: SUBSCRIPTION_SUPPLIER,
      invoiceNumber,
      receipt: receiptUrl,
      deductible: !useKOR,
      deductiblePerc: useKOR ? new Prisma.Decimal(0) : new Prisma.Decimal(100),
      tags: ['declair', 'abonnement'],
    },
  });
  return true;
}
