import { db } from '@/lib/db';
import { getQuarterInfo, isEUCustomer } from './calculations';

/**
 * Generate ICP (Intracommunautaire Prestaties) entries for a quarter
 */
export async function generateICPReport(
  userId: string,
  year: number,
  quarter: number
) {
  const { startDate, endDate } = getQuarterInfo(year, quarter);

  // Get all invoices to EU customers with VAT numbers
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['SENT', 'PAID', 'OVERDUE'],
      },
      customer: {
        vatNumber: {
          not: null,
        },
        vatCountry: {
          not: null,
        },
        NOT: {
          vatCountry: 'NL',
        },
      },
    },
    include: {
      customer: true,
    },
  });

  // Group by customer
  const customerTotals = new Map<string, {
    customerId: string;
    customer: any;
    amount: number;
    invoiceIds: string[];
  }>();

  invoices.forEach(invoice => {
    // Verify it's actually an EU customer
    if (!invoice.customer.vatCountry || !isEUCustomer(invoice.customer.vatCountry)) {
      return;
    }

    const existing = customerTotals.get(invoice.customerId);
    if (existing) {
      existing.amount += Number(invoice.subtotal);
      existing.invoiceIds.push(invoice.id);
    } else {
      customerTotals.set(invoice.customerId, {
        customerId: invoice.customerId,
        customer: invoice.customer,
        amount: Number(invoice.subtotal),
        invoiceIds: [invoice.id],
      });
    }
  });

  // Convert to array and sort
  const entries = Array.from(customerTotals.values())
    .sort((a, b) => a.customer.name.localeCompare(b.customer.name));

  // Save to database
  for (const entry of entries) {
    await db.iCPEntry.upsert({
      where: {
        userId_year_quarter_customerId: {
          userId,
          year,
          quarter,
          customerId: entry.customerId,
        },
      },
      create: {
        userId,
        year,
        quarter,
        customerId: entry.customerId,
        amount: entry.amount,
        invoiceIds: entry.invoiceIds,
      },
      update: {
        amount: entry.amount,
        invoiceIds: entry.invoiceIds,
      },
    });
  }

  return entries;
}
