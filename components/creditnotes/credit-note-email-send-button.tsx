'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from '@/components/providers/locale-provider';
import { T } from '@/components/t';

interface CreditNoteEmailSendButtonProps {
  creditNoteId: string;
  creditNoteNumber: string;
  customerEmail: string;
  onSuccess?: () => void;
}

export function CreditNoteEmailSendButton({
  creditNoteId,
  creditNoteNumber,
  customerEmail,
  onSuccess,
}: CreditNoteEmailSendButtonProps) {
  const router = useRouter();
  const { t } = useTranslations('creditNotesPage');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/creditnotes/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditNoteId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('emailSendError'));
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('emailSendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading} variant="outline">
        <Mail className="mr-2 h-4 w-4" />
        {t('emailSendButton')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('emailDialogTitle')}</DialogTitle>
            <DialogDescription>
              <T ns="creditNotesPage" k="emailDialogDesc" vars={{ email: customerEmail }} />
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {t('emailSuccess')}
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <div className="space-y-2 text-sm">
                <p><strong>{t('emailToLabel')}:</strong> {customerEmail}</p>
                <p><strong>{t('emailCreditNoteLabel')}:</strong> {creditNoteNumber}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('cancelButton')}
            </Button>
            <Button onClick={handleSend} disabled={loading || success}>
              {loading ? (
                <>{t('emailSending')}</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('emailSendAction')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
