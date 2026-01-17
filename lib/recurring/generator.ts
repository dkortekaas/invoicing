import { db } from '@/lib/db';
import { calculateNextDate } from './calculations';
import { addDays } from 'date-fns';

interface GenerateInvoiceOptions {
  recurringInvoiceId: string;
  invoiceDate?: Date;
  sendEmail?: boolean;
  preview?: boolean; // Alleen preview, niet opslaan
}

export async function generateRecurringInvoice({
  recurringInvoiceId,
  invoiceDate = new Date(),
  sendEmail = false,
  preview = false,
}: GenerateInvoiceOptions) {
  // Haal recurring invoice op met alle details
  const recurring = await db.recurringInvoice.findUnique({
    where: { id: recurringInvoiceId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      customer: true,
      user: true,
      priceChanges: {
        where: {
          applied: false,
          effectiveDate: {
            lte: invoiceDate,
          },
        },
        orderBy: {
          effectiveDate: 'asc',
        },
      },
    },
  });

  if (!recurring) {
    throw new Error('Recurring invoice niet gevonden');
  }

  if (recurring.status !== 'ACTIVE') {
    throw new Error('Recurring invoice is niet actief');
  }

  // Check of er een price change moet worden toegepast
  let items = recurring.items;
  if (recurring.priceChanges.length > 0) {
    // Apply price changes (simplified - in productie meer complexe logica)
    const priceChange = recurring.priceChanges[0];
    
    // Mark as applied
    if (!preview && priceChange) {
      await db.recurringPriceChange.update({
        where: { id: priceChange.id },
        data: {
          applied: true,
          appliedAt: new Date(),
        },
      });
    }
  }

  // Bereken totalen
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unitPrice));
  }, 0);

  const vatAmount = items.reduce((sum, item) => {
    const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
    return sum + (itemSubtotal * (Number(item.vatRate) / 100));
  }, 0);

  const total = subtotal + vatAmount;

  // Preview mode: return data zonder opslaan
  if (preview) {
    return {
      preview: true,
      invoiceDate,
      dueDate: addDays(invoiceDate, recurring.customer.paymentTermDays),
      subtotal,
      vatAmount,
      total,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        subtotal: Number(item.quantity) * Number(item.unitPrice),
      })),
    };
  }

  // Genereer invoice number
  const year = invoiceDate.getFullYear();
  const lastInvoice = await db.invoice.findFirst({
    where: {
      userId: recurring.userId,
      invoiceNumber: {
        startsWith: `${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    if (parts.length > 1 && parts[1]) {
      const lastSequence = parseInt(parts[1]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }

  const invoiceNumber = `${year}-${sequence.toString().padStart(4, '0')}`;

  // Bepaal due date
  const dueDate = addDays(invoiceDate, recurring.customer.paymentTermDays);

  // Create invoice
  const invoice = await db.invoice.create({
    data: {
      userId: recurring.userId,
      customerId: recurring.customerId,
      recurringInvoiceId: recurring.id,
      invoiceNumber,
      invoiceDate,
      dueDate,
      status: recurring.autoSend ? 'SENT' : 'DRAFT',
      subtotal,
      vatAmount,
      total,
      reference: recurring.reference,
      notes: recurring.description,
      items: {
        create: items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          subtotal: Number(item.quantity) * Number(item.unitPrice),
          vatAmount: (Number(item.quantity) * Number(item.unitPrice)) * (Number(item.vatRate) / 100),
          total: (Number(item.quantity) * Number(item.unitPrice)) * (1 + Number(item.vatRate) / 100),
          sortOrder: index,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // Increment invoice count (recurring invoices are premium, so no limit check needed)
  // But we still track for analytics
  try {
    const { incrementInvoiceCount } = await import('@/lib/stripe/subscriptions');
    await incrementInvoiceCount(recurring.userId);
  } catch (error) {
    // Non-critical, continue even if this fails
    console.warn('Failed to increment invoice count for recurring invoice:', error);
  }

  // Update recurring invoice
  const nextDate = calculateNextDate(
    invoiceDate,
    recurring.frequency,
    recurring.interval,
    recurring.dayOfMonth || undefined
  );

  await db.recurringInvoice.update({
    where: { id: recurring.id },
    data: {
      lastDate: invoiceDate,
      nextDate,
    },
  });

  // Log actie
  await db.recurringInvoiceLog.create({
    data: {
      recurringInvoiceId: recurring.id,
      action: 'INVOICE_GENERATED',
      invoiceId: invoice.id,
      details: `Factuur ${invoiceNumber} gegenereerd`,
    },
  });

  // Send email indien gewenst
  if (sendEmail && recurring.autoSend) {
    // Import send function dynamically om circular dependency te voorkomen
    const { sendInvoiceEmail } = await import('@/lib/email/send-invoice');
    
    try {
      await sendInvoiceEmail({ invoiceId: invoice.id });
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      // Don't throw - invoice is created
    }
  }

  return invoice;
}

/**
 * Batch genereer alle recurring invoices die vandaag gegenereerd moeten worden
 */
export async function generateDueRecurringInvoices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Haal alle active recurring invoices op die vandaag gegenereerd moeten worden
  const dueRecurring = await db.recurringInvoice.findMany({
    where: {
      status: 'ACTIVE',
      nextDate: {
        lte: today,
      },
      OR: [
        { endDate: null },
        { endDate: { gte: today } },
      ],
    },
    include: {
      items: true,
      customer: true,
    },
  });

  const results = [];

  for (const recurring of dueRecurring) {
    try {
      const invoice = await generateRecurringInvoice({
        recurringInvoiceId: recurring.id,
        invoiceDate: today,
        sendEmail: recurring.autoSend,
      });

      results.push({
        recurringId: recurring.id,
        invoiceId: 'id' in invoice ? invoice.id : undefined,
        success: true,
      });
    } catch (error) {
      console.error(
        `Failed to generate invoice for recurring ${recurring.id}:`,
        error
      );
      
      results.push({
        recurringId: recurring.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
