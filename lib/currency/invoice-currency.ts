/**
 * Invoice Currency Service
 *
 * Handles currency-related operations for invoices:
 * - Getting default currency for customer
 * - Locking exchange rates when invoice is sent
 * - Calculating EUR equivalents
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getExchangeRate } from './rates';
import { calculateEurEquivalents, type EurEquivalents } from './conversion';

/**
 * Get the default currency for a new invoice based on customer preference.
 * Falls back to EUR if customer has no preference.
 */
export async function getInvoiceCurrency(
  customerId: string,
  userId: string
): Promise<{ currencyId: string; currencyCode: string }> {
  // Check if customer has a currency preference
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      currencyId: true,
      currency: {
        select: { code: true },
      },
    },
  });

  if (customer?.currencyId && customer.currency) {
    return {
      currencyId: customer.currencyId,
      currencyCode: customer.currency.code,
    };
  }

  // Fall back to user's base currency or EUR
  const settings = await db.currencySettings.findUnique({
    where: { userId },
    select: {
      baseCurrencyId: true,
      baseCurrency: {
        select: { code: true },
      },
    },
  });

  if (settings?.baseCurrencyId) {
    return {
      currencyId: settings.baseCurrencyId,
      currencyCode: settings.baseCurrency.code,
    };
  }

  // Default to EUR
  const eurCurrency = await db.currency.findUnique({
    where: { code: 'EUR' },
    select: { id: true },
  });

  return {
    currencyId: eurCurrency?.id || '',
    currencyCode: 'EUR',
  };
}

/**
 * Lock the exchange rate for an invoice.
 * Should be called when invoice status changes to SENT.
 */
export async function lockInvoiceExchangeRate(invoiceId: string): Promise<void> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      currencyCode: true,
      subtotal: true,
      vatAmount: true,
      total: true,
      exchangeRateLocked: true,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Skip if already locked or if EUR (no conversion needed)
  if (invoice.exchangeRateLocked || invoice.currencyCode === 'EUR') {
    return;
  }

  // Get current exchange rate
  const rateInfo = await getExchangeRate({
    from: invoice.currencyCode,
    to: 'EUR',
  });

  // Calculate EUR equivalents
  const eurEquivalents = calculateEurEquivalents(
    {
      subtotal: (invoice.subtotal as Prisma.Decimal).toNumber(),
      vatAmount: (invoice.vatAmount as Prisma.Decimal).toNumber(),
      total: (invoice.total as Prisma.Decimal).toNumber(),
    },
    rateInfo.rate // This is the rate to convert TO EUR (inverse rate)
  );

  // Update invoice with locked rate
  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      exchangeRate: new Prisma.Decimal(rateInfo.inverseRate.toFixed(6)), // Store EUR->foreign rate
      exchangeRateDate: rateInfo.date,
      exchangeRateSource: rateInfo.source,
      exchangeRateLocked: true,
      subtotalEur: new Prisma.Decimal(eurEquivalents.subtotalEur.toFixed(2)),
      vatAmountEur: new Prisma.Decimal(eurEquivalents.vatAmountEur.toFixed(2)),
      totalEur: new Prisma.Decimal(eurEquivalents.totalEur.toFixed(2)),
    },
  });
}

/**
 * Calculate EUR equivalents for invoice amounts.
 * Used for display before rate is locked.
 */
export async function calculateInvoiceEurEquivalents(
  currencyCode: string,
  subtotal: number,
  vatAmount: number,
  total: number
): Promise<EurEquivalents | null> {
  if (currencyCode === 'EUR') {
    return null; // No conversion needed
  }

  try {
    const rateInfo = await getExchangeRate({
      from: currencyCode,
      to: 'EUR',
    });

    return calculateEurEquivalents(
      { subtotal, vatAmount, total },
      rateInfo.rate
    );
  } catch {
    // No rate available yet
    return null;
  }
}

/**
 * Get currency info for an invoice, including rate if applicable.
 */
export async function getInvoiceCurrencyInfo(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      currencyCode: true,
      currencyId: true,
      currency: {
        select: {
          name: true,
          nameDutch: true,
          symbol: true,
          decimalPlaces: true,
        },
      },
      exchangeRate: true,
      exchangeRateDate: true,
      exchangeRateSource: true,
      exchangeRateLocked: true,
      subtotalEur: true,
      vatAmountEur: true,
      totalEur: true,
    },
  });

  if (!invoice) {
    return null;
  }

  return {
    currencyCode: invoice.currencyCode,
    currencyId: invoice.currencyId,
    currency: invoice.currency,
    exchangeRate: invoice.exchangeRate
      ? (invoice.exchangeRate as Prisma.Decimal).toNumber()
      : null,
    exchangeRateDate: invoice.exchangeRateDate,
    exchangeRateSource: invoice.exchangeRateSource,
    exchangeRateLocked: invoice.exchangeRateLocked,
    subtotalEur: invoice.subtotalEur
      ? (invoice.subtotalEur as Prisma.Decimal).toNumber()
      : null,
    vatAmountEur: invoice.vatAmountEur
      ? (invoice.vatAmountEur as Prisma.Decimal).toNumber()
      : null,
    totalEur: invoice.totalEur
      ? (invoice.totalEur as Prisma.Decimal).toNumber()
      : null,
  };
}

/**
 * Update invoice currency amounts when currency changes.
 * Only works if exchange rate is not locked.
 */
export async function updateInvoiceCurrencyAmounts(
  invoiceId: string,
  currencyCode: string
): Promise<void> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      exchangeRateLocked: true,
      subtotal: true,
      vatAmount: true,
      total: true,
    },
  });

  if (!invoice || invoice.exchangeRateLocked) {
    return; // Cannot change currency on locked invoice
  }

  // Get currency ID
  const currency = await db.currency.findUnique({
    where: { code: currencyCode },
    select: { id: true },
  });

  if (!currency) {
    throw new Error(`Currency ${currencyCode} not found`);
  }

  // Calculate EUR equivalents if not EUR
  let eurData: Partial<{
    subtotalEur: Prisma.Decimal;
    vatAmountEur: Prisma.Decimal;
    totalEur: Prisma.Decimal;
    exchangeRate: Prisma.Decimal;
    exchangeRateDate: Date;
    exchangeRateSource: 'ECB' | 'MANUAL';
  }> = {};

  if (currencyCode !== 'EUR') {
    try {
      const rateInfo = await getExchangeRate({
        from: currencyCode,
        to: 'EUR',
      });

      const eurEquivalents = calculateEurEquivalents(
        {
          subtotal: (invoice.subtotal as Prisma.Decimal).toNumber(),
          vatAmount: (invoice.vatAmount as Prisma.Decimal).toNumber(),
          total: (invoice.total as Prisma.Decimal).toNumber(),
        },
        rateInfo.rate
      );

      eurData = {
        subtotalEur: new Prisma.Decimal(eurEquivalents.subtotalEur.toFixed(2)),
        vatAmountEur: new Prisma.Decimal(eurEquivalents.vatAmountEur.toFixed(2)),
        totalEur: new Prisma.Decimal(eurEquivalents.totalEur.toFixed(2)),
        exchangeRate: new Prisma.Decimal(rateInfo.inverseRate.toFixed(6)),
        exchangeRateDate: rateInfo.date,
        exchangeRateSource: rateInfo.source,
      };
    } catch {
      // No rate available, leave EUR fields null
    }
  }

  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      currencyId: currency.id,
      currencyCode,
      ...eurData,
    },
  });
}
