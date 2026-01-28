import { differenceInMinutes } from 'date-fns';

// Simplified TimeEntry type for client components (matches TimeEntryList interface)
export interface TimeEntry {
  id: string;
  startTime: Date | string;
  duration: number;
  amount: number;
  billable?: boolean;
  [key: string]: unknown;
}

/**
 * Bereken duration tussen twee tijdstippen in uren (decimaal)
 */
export function calculateDuration(
  startTime: Date,
  endTime: Date
): number {
  const minutes = differenceInMinutes(endTime, startTime);
  return Math.max(0, minutes / 60); // In uren, bijv 1.5 = 1u 30min
}

/**
 * Rond tijd af op basis van interval
 * @param minutes - Aantal minuten
 * @param interval - Afrondingsinterval (0, 15, 30, 60)
 */
export function roundDuration(
  minutes: number,
  interval: number
): number {
  if (interval === 0) return minutes;
  
  return Math.ceil(minutes / interval) * interval;
}

/**
 * Bereken bedrag op basis van uren en tarief
 */
export function calculateAmount(
  duration: number,
  hourlyRate: number
): number {
  return duration * hourlyRate;
}

/**
 * Parse duration string naar minuten
 * Ondersteunt: "1.5", "1:30", "90"
 */
export function parseDuration(input: string): number {
  // Remove whitespace
  const clean = input.trim();
  
  // Format: "1:30" (uren:minuten)
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const hours = Number(parts[0]) || 0;
    const minutes = Number(parts[1]) || 0;
    return (hours * 60) + minutes;
  }
  
  // Format: "1.5" (decimale uren)
  if (clean.includes('.') || clean.includes(',')) {
    const hours = parseFloat(clean.replace(',', '.'));
    return hours * 60;
  }
  
  // Format: "90" (minuten)
  return Number(clean);
}

/**
 * Format duration naar leesbaar formaat
 */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  if (m === 0) return `${h}u`;
  return `${h}u ${m}m`;
}

/**
 * Format duration naar decimaal (voor facturen)
 */
export function formatDurationDecimal(hours: number): string {
  return hours.toFixed(2);
}

/**
 * Groepeer entries per dag
 */
export function groupEntriesByDay<T extends TimeEntry>(entries: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  entries.forEach(entry => {
    const dateStr = typeof entry.startTime === 'string' 
      ? entry.startTime
      : entry.startTime.toISOString();
    const date = dateStr.split('T')[0];
    if (!date) return; // Skip if date parsing fails
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(entry);
  });
  
  return grouped;
}

/**
 * Bereken totalen voor entries
 */
export function calculateTotals(entries: TimeEntry[]) {
  return entries.reduce(
    (acc, entry) => ({
      duration: acc.duration + Number(entry.duration),
      amount: acc.amount + Number(entry.amount),
      billableAmount: acc.billableAmount + (entry.billable ? Number(entry.amount) : 0),
      billableDuration: acc.billableDuration + (entry.billable ? Number(entry.duration) : 0),
    }),
    {
      duration: 0,
      amount: 0,
      billableAmount: 0,
      billableDuration: 0,
    }
  );
}
