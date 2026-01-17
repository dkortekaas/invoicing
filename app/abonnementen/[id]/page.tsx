import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { RecurringForm } from '@/components/recurring/recurring-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { formatFrequency, calculateMRR } from '@/lib/recurring/calculations';

export const dynamic = 'force-dynamic';

interface AbonnementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AbonnementDetailPage({ params }: AbonnementDetailPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const recurring = await db.recurringInvoice.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      invoices: {
        orderBy: { invoiceDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!recurring) {
    notFound();
  }

  const customers = await db.customer.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      companyName: true,
    },
  });

  const total = recurring.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  const mrr = calculateMRR(total, recurring.frequency, recurring.interval);

  const STATUS_CONFIG = {
    ACTIVE: { label: 'Actief', variant: 'default' as const },
    PAUSED: { label: 'Gepauzeerd', variant: 'secondary' as const },
    ENDED: { label: 'Afgelopen', variant: 'outline' as const },
    CANCELLED: { label: 'Geannuleerd', variant: 'destructive' as const },
  };

  const statusConfig = STATUS_CONFIG[recurring.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/abonnementen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{recurring.name}</h1>
            <p className="text-muted-foreground">{recurring.customer.name}</p>
          </div>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <RecurringForm
              customers={customers}
              initialData={{
                id: recurring.id,
                name: recurring.name,
                description: recurring.description || undefined,
                customerId: recurring.customerId,
                frequency: recurring.frequency,
                interval: recurring.interval,
                startDate: recurring.startDate,
                endDate: recurring.endDate || undefined,
                dayOfMonth: recurring.dayOfMonth || undefined,
                autoSend: recurring.autoSend,
                sendDays: recurring.sendDays,
                reference: recurring.reference || undefined,
                notes: recurring.notes || undefined,
                items: recurring.items.map(item => ({
                  description: item.description,
                  quantity: Number(item.quantity),
                  unitPrice: Number(item.unitPrice),
                  vatRate: Number(item.vatRate),
                })),
              }}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Overzicht</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Frequentie</div>
                <div className="font-medium">
                  {formatFrequency(recurring.frequency, recurring.interval)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bedrag</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('nl-NL', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(total)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">MRR</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('nl-NL', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(mrr)}
                </div>
              </div>
              {recurring.status === 'ACTIVE' && (
                <div>
                  <div className="text-sm text-muted-foreground">Volgende factuur</div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(recurring.nextDate), 'dd MMM yyyy', { locale: nl })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {recurring.invoices.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recente facturen</h3>
              <div className="space-y-2">
                {recurring.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/facturen/${invoice.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{invoice.invoiceNumber}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(invoice.invoiceDate), 'dd MMM yyyy', { locale: nl })}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
