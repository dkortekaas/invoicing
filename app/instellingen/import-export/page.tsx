import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { db } from '@/lib/db';
import { ImportExportPage } from './import-export-page';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Get counts for each entity
  const [customerCount, invoiceCount, expenseCount, productCount, timeEntryCount, recentJobs] =
    await Promise.all([
      db.customer.count({ where: { userId: user.id } }),
      db.invoice.count({ where: { userId: user.id } }),
      db.expense.count({ where: { userId: user.id } }),
      db.product.count({ where: { userId: user.id } }),
      db.timeEntry.count({ where: { userId: user.id } }),
      db.importExportJob.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          entityType: true,
          status: true,
          fileName: true,
          totalRows: true,
          successRows: true,
          errorRows: true,
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);

  return (
    <ImportExportPage
      counts={{
        customers: customerCount,
        invoices: invoiceCount,
        expenses: expenseCount,
        products: productCount,
        timeEntries: timeEntryCount,
      }}
      recentJobs={recentJobs.map((job: { id: string; type: string; entityType: string; status: string; fileName: string | null; totalRows: number | null; successRows: number | null; errorRows: number | null; createdAt: Date; completedAt: Date | null }) => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() || null,
      }))}
    />
  );
}
