'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Trash, 
  FileText,
  Edit,
  Calendar,
} from 'lucide-react';
import { formatFrequency, calculateMRR } from '@/lib/recurring/calculations';
import { RecurringFrequency } from '@prisma/client';
import Link from 'next/link';
import { useTranslations } from '@/components/providers/locale-provider';

const STATUS_VARIANT_MAP: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'default',
  PAUSED: 'secondary',
  ENDED: 'outline',
  CANCELLED: 'destructive',
};

const STATUS_KEY_MAP: Record<string, string> = {
  ACTIVE: 'statusActive',
  PAUSED: 'statusPaused',
  ENDED: 'statusEnded',
  CANCELLED: 'statusCancelled',
};

interface RecurringCardProps {
  recurring: {
    id: string;
    name: string;
    description?: string | null;
    frequency: string;
    interval: number;
    nextDate: Date | string;
    status: string;
    customer: {
      name: string;
    };
    items: Array<{
      quantity: number | string;
      unitPrice: number | string;
    }>;
    _count: {
      invoices: number;
    };
  };
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGenerate?: (id: string) => void;
}

export function RecurringCard({
  recurring,
  onPause,
  onResume,
  onDelete,
  onGenerate,
}: RecurringCardProps) {
  const { t } = useTranslations('recurringPage');

  const total = recurring.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  const mrr = calculateMRR(total, recurring.frequency as RecurringFrequency, recurring.interval);
  const statusVariant = STATUS_VARIANT_MAP[recurring.status] ?? 'default';

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{recurring.name}</h3>
            <Badge variant={statusVariant}>
              {t(STATUS_KEY_MAP[recurring.status] ?? 'statusActive')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{recurring.customer.name}</p>
          {recurring.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {recurring.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/abonnementen/${recurring.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('actionEdit')}
              </Link>
            </DropdownMenuItem>
            
            {recurring.status === 'ACTIVE' && onGenerate && (
              <DropdownMenuItem onClick={() => onGenerate(recurring.id)}>
                <FileText className="mr-2 h-4 w-4" />
                {t('actionGenerateNow')}
              </DropdownMenuItem>
            )}

            {recurring.status === 'ACTIVE' && onPause && (
              <DropdownMenuItem onClick={() => onPause(recurring.id)}>
                <Pause className="mr-2 h-4 w-4" />
                {t('actionPause')}
              </DropdownMenuItem>
            )}

            {recurring.status === 'PAUSED' && onResume && (
              <DropdownMenuItem onClick={() => onResume(recurring.id)}>
                <Play className="mr-2 h-4 w-4" />
                {t('actionResume')}
              </DropdownMenuItem>
            )}

            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(recurring.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                {t('actionDelete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-muted-foreground">{t('frequencyLabel')}</div>
          <div className="font-medium">
            {formatFrequency(recurring.frequency as RecurringFrequency, recurring.interval)}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">{t('amountLabel')}</div>
          <div className="font-medium">
            {new Intl.NumberFormat('nl-NL', {
              style: 'currency',
              currency: 'EUR',
            }).format(total)}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">{t('mrrLabel')}</div>
          <div className="font-medium">
            {new Intl.NumberFormat('nl-NL', {
              style: 'currency',
              currency: 'EUR',
            }).format(mrr)}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">{t('invoicesCount')}</div>
          <div className="font-medium">{recurring._count.invoices}</div>
        </div>
      </div>

      {recurring.status === 'ACTIVE' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
          <Calendar className="h-4 w-4" />
          <span>
            {t('nextInvoicePrefix')}{' '}
            <span className="font-medium text-foreground">
              {format(new Date(recurring.nextDate), 'dd MMM yyyy', { locale: nl })}
            </span>
          </span>
        </div>
      )}
    </Card>
  );
}
