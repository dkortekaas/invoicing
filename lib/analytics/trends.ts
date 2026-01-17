import { db } from '@/lib/db';
import { 
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  subMonths,
} from 'date-fns';
import { nl } from 'date-fns/locale/nl';

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  invoices: number;
  hours?: number;
}

export async function getMonthlyTrends(
  userId: string,
  months: number = 12
): Promise<MonthlyData[]> {
  const endDate = endOfMonth(new Date());
  const startDate = startOfMonth(subMonths(endDate, months - 1));

  const monthsInRange = eachMonthOfInterval({
    start: startDate,
    end: endDate,
  });

  const results = await Promise.all(
    monthsInRange.map(async (month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Get invoices
      const invoices = await db.invoice.findMany({
        where: {
          userId,
          status: 'PAID',
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const revenue = invoices.reduce(
        (sum, i) => sum + Number(i.total),
        0
      );

      // Get expenses
      const expenses = await db.expense.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const expenseTotal = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );

      // Get time entries
      const timeEntries = await db.timeEntry.findMany({
        where: {
          userId,
          startTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const hours = timeEntries.reduce(
        (sum, t) => sum + Number(t.duration),
        0
      );

      return {
        month: format(month, 'MMM yyyy', { locale: nl }),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
        invoices: invoices.length,
        hours: timeEntries.length > 0 ? hours : undefined,
      };
    })
  );

  return results;
}

export interface CustomerDistribution {
  name: string;
  value: number;
  percentage: number;
}

export async function getTopCustomers(
  userId: string,
  limit: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<CustomerDistribution[]> {
  const start = startDate || startOfMonth(subMonths(new Date(), 12));
  const end = endDate || new Date();

  const invoices = await db.invoice.findMany({
    where: {
      userId,
      status: 'PAID',
      paidAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      customer: true,
    },
  });

  // Group by customer
  const customerTotals = new Map<string, {
    name: string;
    total: number;
  }>();

  invoices.forEach(invoice => {
    const existing = customerTotals.get(invoice.customerId);
    if (existing) {
      existing.total += Number(invoice.total);
    } else {
      customerTotals.set(invoice.customerId, {
        name: invoice.customer.name,
        total: Number(invoice.total),
      });
    }
  });

  // Convert to array and sort
  const sorted = Array.from(customerTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const totalRevenue = sorted.reduce((sum, c) => sum + c.total, 0);

  return sorted.map(customer => ({
    name: customer.name,
    value: customer.total,
    percentage: totalRevenue > 0 ? (customer.total / totalRevenue) * 100 : 0,
  }));
}
