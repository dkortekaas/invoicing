import { db } from '@/lib/db';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  subMonths,
  differenceInDays,
} from 'date-fns';

export interface KPIData {
  // Revenue
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number; // %
  
  // Profit
  totalProfit: number;
  profitMargin: number; // %
  
  // Outstanding
  totalOutstanding: number;
  overdueAmount: number;
  
  // Invoices
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageInvoiceValue: number;
  
  // Payment
  averagePaymentDays: number;
  
  // Customers
  totalCustomers: number;
  activeCustomers: number; // Customers with invoices in last 90 days
  newCustomers: number; // New this month
  
  // Time (if time tracking enabled)
  totalHours?: number;
  billableHours?: number;
  utilizationRate?: number; // %
  
  // MRR/ARR (if recurring invoices)
  mrr?: number;
  arr?: number;
}

export async function calculateKPIs(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<KPIData> {
  const start = startDate || startOfYear(new Date());
  const end = endDate || endOfYear(new Date());
  
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // Get all invoices in period
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      invoiceDate: {
        gte: start,
        lte: end,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    include: {
      customer: true,
    },
  });

  // Revenue calculations
  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total), 0);

  const revenueThisMonth = invoices
    .filter(i => 
      i.status === 'PAID' &&
      i.paidAt &&
      i.paidAt >= thisMonthStart &&
      i.paidAt <= thisMonthEnd
    )
    .reduce((sum, i) => sum + Number(i.total), 0);

  const revenueLastMonth = invoices
    .filter(i =>
      i.status === 'PAID' &&
      i.paidAt &&
      i.paidAt >= lastMonthStart &&
      i.paidAt <= lastMonthEnd
    )
    .reduce((sum, i) => sum + Number(i.total), 0);

  const revenueGrowth = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : 0;

  // Get expenses
  const expenses = await db.expense.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Outstanding amounts
  const outstandingInvoices = invoices.filter(i => 
    i.status === 'SENT' || i.status === 'OVERDUE'
  );
  
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, i) => sum + Number(i.total),
    0
  );

  const overdueAmount = invoices
    .filter(i => i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.total), 0);

  // Invoice stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
  const unpaidInvoices = totalInvoices - paidInvoices;
  const averageInvoiceValue = paidInvoices > 0
    ? totalRevenue / paidInvoices
    : 0;

  // Average payment days
  const paidInvoicesWithDates = invoices.filter(
    i => i.status === 'PAID' && i.paidAt
  );
  
  const totalPaymentDays = paidInvoicesWithDates.reduce((sum, i) => {
    if (!i.paidAt) return sum;
    return sum + differenceInDays(i.paidAt, i.invoiceDate);
  }, 0);

  const averagePaymentDays = paidInvoicesWithDates.length > 0
    ? totalPaymentDays / paidInvoicesWithDates.length
    : 0;

  // Customer stats
  const uniqueCustomerIds = new Set(invoices.map(i => i.customerId));
  const totalCustomers = uniqueCustomerIds.size;

  const ninetyDaysAgo = subMonths(new Date(), 3);
  const activeCustomerIds = new Set(
    invoices
      .filter(i => i.invoiceDate >= ninetyDaysAgo)
      .map(i => i.customerId)
  );
  const activeCustomers = activeCustomerIds.size;

  const newCustomerIds = new Set(
    invoices
      .filter(i => i.invoiceDate >= thisMonthStart)
      .map(i => i.customerId)
  );
  const newCustomers = newCustomerIds.size;

  // Time tracking stats (optional)
  const timeEntries = await db.timeEntry.findMany({
    where: {
      userId,
      startTime: {
        gte: start,
        lte: end,
      },
    },
  });

  const totalHours = timeEntries.reduce(
    (sum, t) => sum + Number(t.duration),
    0
  );

  const billableHours = timeEntries
    .filter(t => t.billable)
    .reduce((sum, t) => sum + Number(t.duration), 0);

  const utilizationRate = totalHours > 0
    ? (billableHours / totalHours) * 100
    : 0;

  // MRR/ARR (from recurring invoices)
  const recurringInvoices = await db.recurringInvoice.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      items: true,
    },
  });

  let mrr = 0;
  recurringInvoices.forEach(r => {
    const total = r.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    
    // Convert to monthly
    const monthlyAmount = convertToMonthly(total, r.frequency, r.interval);
    mrr += monthlyAmount;
  });

  const arr = mrr * 12;

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowth,
    totalProfit,
    profitMargin,
    totalOutstanding,
    overdueAmount,
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    averageInvoiceValue,
    averagePaymentDays,
    totalCustomers,
    activeCustomers,
    newCustomers,
    totalHours: timeEntries.length > 0 ? totalHours : undefined,
    billableHours: timeEntries.length > 0 ? billableHours : undefined,
    utilizationRate: timeEntries.length > 0 ? utilizationRate : undefined,
    mrr: recurringInvoices.length > 0 ? mrr : undefined,
    arr: recurringInvoices.length > 0 ? arr : undefined,
  };
}

function convertToMonthly(
  amount: number,
  frequency: string,
  interval: number
): number {
  switch (frequency) {
    case 'WEEKLY':
      return (amount * 52) / 12 / interval;
    case 'BIWEEKLY':
      return (amount * 26) / 12 / interval;
    case 'MONTHLY':
      return amount / interval;
    case 'QUARTERLY':
      return (amount / 3) / interval;
    case 'BIANNUAL':
      return (amount / 6) / interval;
    case 'ANNUAL':
      return (amount / 12) / interval;
    default:
      return 0;
  }
}
