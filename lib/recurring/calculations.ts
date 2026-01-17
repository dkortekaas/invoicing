import { 
  addWeeks, 
  addMonths, 
  addQuarters, 
  addYears,
  setDate,
  endOfMonth,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import { RecurringFrequency } from '@prisma/client';

/**
 * Bereken volgende factuurdatum op basis van frequency
 */
export function calculateNextDate(
  currentDate: Date,
  frequency: RecurringFrequency,
  interval: number = 1,
  dayOfMonth?: number | null
): Date {
  let nextDate: Date;

  switch (frequency) {
    case 'WEEKLY':
      nextDate = addWeeks(currentDate, interval);
      break;
    case 'BIWEEKLY':
      nextDate = addWeeks(currentDate, 2 * interval);
      break;
    case 'MONTHLY':
      nextDate = addMonths(currentDate, interval);
      // Als specifieke dag van maand gewenst
      if (dayOfMonth) {
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;
    case 'QUARTERLY':
      nextDate = addQuarters(currentDate, interval);
      if (dayOfMonth) {
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;
    case 'BIANNUAL':
      nextDate = addMonths(currentDate, 6 * interval);
      if (dayOfMonth) {
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;
    case 'ANNUAL':
      nextDate = addYears(currentDate, interval);
      if (dayOfMonth) {
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  return startOfDay(nextDate);
}

function getDaysInMonth(date: Date): number {
  return endOfMonth(date).getDate();
}

/**
 * Check of een recurring invoice vandaag gegenereerd moet worden
 */
export function shouldGenerateToday(
  nextDate: Date,
  endDate?: Date | null
): boolean {
  const today = startOfDay(new Date());
  const next = startOfDay(nextDate);

  // Check of nextDate is bereikt of gepasseerd
  if (isAfter(today, next) || today.getTime() === next.getTime()) {
    // Check of subscription niet afgelopen is
    if (endDate) {
      const end = startOfDay(endDate);
      if (isAfter(today, end)) {
        return false; // Subscription is afgelopen
      }
    }
    return true;
  }

  return false;
}

/**
 * Bereken aantal periodes tussen twee datums
 */
export function calculatePeriodsBetween(
  startDate: Date,
  endDate: Date,
  frequency: RecurringFrequency,
  interval: number = 1
): number {
  let periods = 0;
  let currentDate = new Date(startDate);

  while (isBefore(currentDate, endDate)) {
    currentDate = calculateNextDate(currentDate, frequency, interval);
    periods++;
    
    // Safety check
    if (periods > 1000) {
      throw new Error('Too many periods calculated');
    }
  }

  return periods;
}

/**
 * Format frequency naar leesbare tekst
 */
export function formatFrequency(
  frequency: RecurringFrequency,
  interval: number = 1
): string {
  const labels: Record<RecurringFrequency, string> = {
    WEEKLY: interval === 1 ? 'Wekelijks' : `Elke ${interval} weken`,
    BIWEEKLY: 'Tweewekelijks',
    MONTHLY: interval === 1 ? 'Maandelijks' : `Elke ${interval} maanden`,
    QUARTERLY: interval === 1 ? 'Kwartaal' : `Elke ${interval} kwartalen`,
    BIANNUAL: 'Halfjaarlijks',
    ANNUAL: interval === 1 ? 'Jaarlijks' : `Elke ${interval} jaar`,
  };

  return labels[frequency];
}

/**
 * Bereken pro-rata bedrag voor gedeeltelijke periode
 */
export function calculateProration(
  amount: number,
  periodStart: Date,
  periodEnd: Date,
  actualStart: Date,
  actualEnd: Date
): number {
  const totalDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const usedDays = Math.ceil(
    (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (amount / totalDays) * usedDays;
}

/**
 * Bereken MRR (Monthly Recurring Revenue)
 */
export function calculateMRR(
  amount: number,
  frequency: RecurringFrequency,
  interval: number = 1
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

/**
 * Bereken ARR (Annual Recurring Revenue)
 */
export function calculateARR(
  amount: number,
  frequency: RecurringFrequency,
  interval: number = 1
): number {
  return calculateMRR(amount, frequency, interval) * 12;
}
