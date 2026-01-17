'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Mail, MailOpen, MousePointerClick, AlertCircle } from 'lucide-react';

interface EmailLog {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  error: string | null;
}

interface EmailHistoryListProps {
  emails: EmailLog[];
}

const STATUS_CONFIG = {
  SENT: { label: 'Verzonden', variant: 'default' as const, icon: Mail },
  DELIVERED: { label: 'Afgeleverd', variant: 'default' as const, icon: Mail },
  OPENED: { label: 'Geopend', variant: 'secondary' as const, icon: MailOpen },
  CLICKED: { label: 'Geklikt', variant: 'secondary' as const, icon: MousePointerClick },
  FAILED: { label: 'Mislukt', variant: 'destructive' as const, icon: AlertCircle },
  BOUNCED: { label: 'Gebounced', variant: 'destructive' as const, icon: AlertCircle },
  PENDING: { label: 'In behandeling', variant: 'outline' as const, icon: Mail },
};

const TYPE_LABELS = {
  INVOICE: 'Factuur',
  REMINDER_FRIENDLY: 'Vriendelijke herinnering',
  REMINDER_FIRST: '1e herinnering',
  REMINDER_SECOND: '2e herinnering',
  REMINDER_FINAL: 'Finale herinnering',
  PAYMENT_RECEIVED: 'Betaalbevestiging',
};

export function EmailHistoryList({ emails }: EmailHistoryListProps) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nog geen emails verzonden
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const config = STATUS_CONFIG[email.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
        const Icon = config.icon;

        return (
          <div key={email.id} className="flex items-start gap-3 p-4 border rounded-lg">
            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.variant}>
                  {config.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {TYPE_LABELS[email.type as keyof typeof TYPE_LABELS] || email.type}
                </span>
              </div>
              
              <p className="text-sm font-medium truncate">{email.subject}</p>
              <p className="text-sm text-muted-foreground">Naar: {email.recipient}</p>
              
              {email.sentAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Verzonden: {format(new Date(email.sentAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                </p>
              )}
              
              {email.openedAt && (
                <p className="text-xs text-muted-foreground">
                  Geopend: {format(new Date(email.openedAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                </p>
              )}
              
              {email.error && (
                <p className="text-xs text-red-600 mt-1">Fout: {email.error}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
