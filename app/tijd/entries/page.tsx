import { Suspense } from 'react';
import { TimeEntryList } from '@/components/time/time-entry-list';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { T } from '@/components/t';

export default async function TimeEntriesPage() {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    return null;
  }

  const rawEntries = await db.timeEntry.findMany({
    where: {
      userId: user.id,
    },
    include: {
      project: true,
      customer: true,
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  // Convert Prisma Decimal objects to numbers and transform to match TimeEntryList interface
  const entries = rawEntries.map(entry => ({
    id: entry.id,
    description: entry.description,
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: Number(entry.duration),
    hourlyRate: Number(entry.hourlyRate),
    amount: Number(entry.amount),
    billable: entry.billable,
    invoiced: entry.invoiced,
    activityType: entry.activityType,
    notes: entry.notes,
    project: entry.project ? {
      name: entry.project.name,
      color: entry.project.color || undefined,
    } : null,
    customer: entry.customer ? {
      name: entry.customer.name,
    } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold"><T ns="timePage" k="entriesTitle" /></h1>
          <p className="text-muted-foreground">
            <T ns="timePage" k="entriesDescription" />
          </p>
        </div>

        <Button asChild>
          <Link href="/tijd/entries/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            <T ns="timePage" k="entriesNewButton" />
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div><T ns="timePage" k="loading" /></div>}>
        <TimeEntryList entries={entries} />
      </Suspense>
    </div>
  );
}
