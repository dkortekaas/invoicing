import { Suspense } from 'react';
import { TimeEntryList } from '@/components/time/time-entry-list';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

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

  // Convert Prisma Decimal objects to numbers for client component serialization
  const entries = rawEntries.map(entry => ({
    ...entry,
    duration: Number(entry.duration),
    hourlyRate: Number(entry.hourlyRate),
    amount: Number(entry.amount),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Entries</h1>
          <p className="text-muted-foreground">
            Overzicht van alle geregistreerde tijd
          </p>
        </div>

        <Button asChild>
          <Link href="/tijd/entries/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe entry
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Laden...</div>}>
        <TimeEntryList entries={entries} />
      </Suspense>
    </div>
  );
}
