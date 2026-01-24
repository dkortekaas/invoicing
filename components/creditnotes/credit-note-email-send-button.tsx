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
        throw new Error(data.error || 'Email verzenden mislukt');
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
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading} variant="outline">
        <Mail className="mr-2 h-4 w-4" />
        Credit nota versturen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit nota versturen</DialogTitle>
            <DialogDescription>
              Email wordt verzonden naar {customerEmail}
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
                  Credit nota succesvol verzonden!
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <div className="space-y-2 text-sm">
                <p><strong>Aan:</strong> {customerEmail}</p>
                <p><strong>Credit nota:</strong> {creditNoteNumber}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSend} disabled={loading || success}>
              {loading ? (
                <>Verzenden...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Verstuur
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
