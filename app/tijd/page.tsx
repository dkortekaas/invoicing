import { Suspense } from 'react';
import { TimerWidget } from '@/components/time/timer-widget';
import { TimeEntryList } from '@/components/time/time-entry-list';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/import-export';

export default async function TijdPage() {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    return null;
  }

  // Haal recente entries op (laatste 7 dagen)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  type TimeEntryData = {
    id: string;
    description: string;
    startTime: Date;
    endTime?: Date | null;
    duration: number;
    hourlyRate: number;
    amount: number;
    billable: boolean;
    invoiced: boolean;
    activityType?: string | null;
    notes?: string | null;
    project?: {
      name: string;
      color?: string;
    } | null;
    customer?: {
      name: string;
    } | null;
  };

  let recentEntries: TimeEntryData[] = [];
  try {
    const entries = await db.timeEntry.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        project: true,
        customer: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 20,
    });

    // Convert Prisma Decimal objects to numbers for client component serialization
    recentEntries = entries.map(entry => ({
      ...entry,
      duration: Number(entry.duration),
      hourlyRate: Number(entry.hourlyRate),
      amount: Number(entry.amount),
      project: entry.project ? {
        name: entry.project.name,
        color: entry.project.color || undefined,
      } : null,
    }));
  } catch (error) {
    console.error('Error loading time entries:', error);
    // If timeEntry doesn't exist, it means Prisma client needs to be regenerated
    if (error instanceof Error && (error.message?.includes('timeEntry') || error.message?.includes('Cannot read'))) {
      console.error('Prisma client is not up-to-date. Please restart the dev server.');
    }
    // Return empty array to prevent crash
    recentEntries = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tijdregistratie</h1>
          <p className="text-muted-foreground">
            Registreer je tijd en factureer eenvoudig
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton entityType="TIME_ENTRIES" totalCount={recentEntries.length} />
          <Button variant="outline" asChild>
            <Link href="/tijd/entries">
              <FileText className="mr-2 h-4 w-4" />
              Alle entries
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimerWidget />
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tijd/entries/nieuw">
                <Plus className="mr-2 h-4 w-4" />
                Handmatige entry
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tijd/projecten">
                Projecten beheren
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recente entries</h2>
        <Suspense fallback={<div>Laden...</div>}>
          <TimeEntryList entries={recentEntries} />
        </Suspense>
      </div>
    </div>
  );
}
