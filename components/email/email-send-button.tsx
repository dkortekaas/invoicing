'use client';

import { useState } from 'react';
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

interface EmailSendButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string;
  type?: 'invoice' | 'reminder' | 'payment-confirmation';
  reminderType?: 'friendly' | 'first' | 'second' | 'final';
  onSuccess?: () => void;
}

export function EmailSendButton({
  invoiceId,
  invoiceNumber,
  customerEmail,
  type = 'invoice',
  reminderType,
  onSuccess,
}: EmailSendButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          type,
          reminderType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Email verzenden mislukt');
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = {
    invoice: 'Factuur versturen',
    reminder: 'Herinnering versturen',
    'payment-confirmation': 'Betalingsbevestiging versturen',
  }[type];

  const reminderTypeLabels = {
    friendly: 'Vriendelijke herinnering',
    first: 'Eerste herinnering',
    second: 'Tweede herinnering',
    final: 'Finale herinnering',
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading} variant="outline">
        <Mail className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{buttonText}</DialogTitle>
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
                  Email succesvol verzonden!
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <div className="space-y-2 text-sm">
                <p><strong>Aan:</strong> {customerEmail}</p>
                <p><strong>Factuur:</strong> {invoiceNumber}</p>
                {type === 'reminder' && reminderType && (
                  <p><strong>Type:</strong> {reminderTypeLabels[reminderType]}</p>
                )}
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
