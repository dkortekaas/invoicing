import { db } from '@/lib/db';
import { getQuarterInfo } from './calculations';

interface VATReportData {
  // Revenue
  revenueHighRate: number;
  revenueHighVAT: number;
  revenueLowRate: number;
  revenueLowVAT: number;
  revenueZeroRate: number;
  revenueReversed: number;
  revenueEU: number;
  revenueExport: number;
  
  // Expenses
  expensesHighRate: number;
  expensesHighVAT: number;
  expensesLowRate: number;
  expensesLowVAT: number;
  expensesReversed: number;
  
  // Totals
  totalRevenue: number;
  totalRevenueVAT: number;
  totalExpenses: number;
  totalExpensesVAT: number;
  
  // Balance
  vatOwed: number;
  vatDeductible: number;
  vatBalance: number;
}

export async function generateVATReport(
  userId: string,
  year: number,
  quarter: number
): Promise<VATReportData> {
  const { startDate, endDate } = getQuarterInfo(year, quarter);

  // Haal alle facturen op voor deze periode
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['SENT', 'PAID', 'OVERDUE'], // Exclude DRAFT and CANCELLED
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });

  // Haal alle credit nota's op voor deze periode
  const creditNotes = await db.creditNote.findMany({
    where: {
      userId,
      creditNoteDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['FINAL', 'SENT', 'PROCESSED', 'REFUNDED'], // Exclude DRAFT
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });

  // Initialize totals
  let revenueHighRate = 0;
  let revenueHighVAT = 0;
  let revenueLowRate = 0;
  let revenueLowVAT = 0;
  let revenueZeroRate = 0;
  let revenueReversed = 0;
  let revenueEU = 0;
  const revenueExport = 0;

  // Process invoices (add to revenue)
  invoices.forEach(invoice => {
    // Check for special cases
    if (invoice.customer.vatReversed) {
      revenueReversed += Number(invoice.subtotal);
      return;
    }

    if (invoice.customer.vatCountry &&
        invoice.customer.vatCountry !== 'NL' &&
        invoice.customer.vatNumber) {
      // EU customer with VAT number = ICP
      revenueEU += Number(invoice.subtotal);
      return;
    }

    // Group by VAT rate
    invoice.items.forEach(item => {
      const vatRate = Number(item.vatRate);
      const subtotal = Number(item.subtotal);
      const vat = Number(item.vatAmount);

      if (vatRate >= 20) {
        revenueHighRate += subtotal;
        revenueHighVAT += vat;
      } else if (vatRate >= 8 && vatRate <= 10) {
        revenueLowRate += subtotal;
        revenueLowVAT += vat;
      } else {
        revenueZeroRate += subtotal;
      }
    });
  });

  // Process credit notes (subtract from revenue)
  creditNotes.forEach(creditNote => {
    // Check for special cases
    if (creditNote.customer.vatReversed) {
      revenueReversed -= Number(creditNote.subtotal);
      return;
    }

    if (creditNote.customer.vatCountry &&
        creditNote.customer.vatCountry !== 'NL' &&
        creditNote.customer.vatNumber) {
      // EU customer with VAT number = ICP
      revenueEU -= Number(creditNote.subtotal);
      return;
    }

    // Group by VAT rate
    creditNote.items.forEach(item => {
      const vatRate = Number(item.vatRate);
      const subtotal = Number(item.subtotal);
      const vat = Number(item.vatAmount);

      if (vatRate >= 20) {
        revenueHighRate -= subtotal;
        revenueHighVAT -= vat;
      } else if (vatRate >= 8 && vatRate <= 10) {
        revenueLowRate -= subtotal;
        revenueLowVAT -= vat;
      } else {
        revenueZeroRate -= subtotal;
      }
    });
  });

  // Haal expenses op voor deze periode
  const expenses = await db.expense.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      deductible: true,
    },
  });

  let expensesHighRate = 0;
  let expensesHighVAT = 0;
  let expensesLowRate = 0;
  let expensesLowVAT = 0;
  const expensesReversed = 0;

  expenses.forEach(expense => {
    const vatRate = Number(expense.vatRate);
    const netAmount = Number(expense.netAmount);
    const vatAmount = Number(expense.vatAmount);
    const deductiblePerc = Number(expense.deductiblePerc);

    // Calculate deductible VAT
    const deductibleVAT = vatAmount * (deductiblePerc / 100);

    if (vatRate >= 20) {
      expensesHighRate += netAmount;
      expensesHighVAT += deductibleVAT;
    } else if (vatRate >= 8 && vatRate <= 10) {
      expensesLowRate += netAmount;
      expensesLowVAT += deductibleVAT;
    } else if (vatRate === 0) {
      // Could be reversed charge
      // Check if it's actually reversed (implement logic based on category/supplier)
    }
  });

  // Calculate totals
  const totalRevenue = revenueHighRate + revenueLowRate + revenueZeroRate + revenueReversed + revenueEU + revenueExport;
  const totalRevenueVAT = revenueHighVAT + revenueLowVAT;
  
  const totalExpenses = expensesHighRate + expensesLowRate + expensesReversed;
  const totalExpensesVAT = expensesHighVAT + expensesLowVAT;
  
  const vatOwed = totalRevenueVAT;
  const vatDeductible = totalExpensesVAT;
  const vatBalance = vatOwed - vatDeductible;

  return {
    revenueHighRate,
    revenueHighVAT,
    revenueLowRate,
    revenueLowVAT,
    revenueZeroRate,
    revenueReversed,
    revenueEU,
    revenueExport,
    
    expensesHighRate,
    expensesHighVAT,
    expensesLowRate,
    expensesLowVAT,
    expensesReversed,
    
    totalRevenue,
    totalRevenueVAT,
    totalExpenses,
    totalExpensesVAT,
    
    vatOwed,
    vatDeductible,
    vatBalance,
  };
}

/**
 * Save or update VAT report
 */
export async function saveVATReport(
  userId: string,
  year: number,
  quarter: number,
  status: 'DRAFT' | 'FINAL' | 'FILED' = 'DRAFT'
) {
  const data = await generateVATReport(userId, year, quarter);
  const { startDate, endDate } = getQuarterInfo(year, quarter);

  const existing = await db.vATReport.findUnique({
    where: {
      userId_year_quarter: {
        userId,
        year,
        quarter,
      },
    },
  });

  if (existing) {
    return db.vATReport.update({
      where: { id: existing.id },
      data: {
        ...data,
        status,
        startDate,
        endDate,
      },
    });
  }

  return db.vATReport.create({
    data: {
      userId,
      year,
      quarter,
      startDate,
      endDate,
      ...data,
      status,
    },
  });
}
