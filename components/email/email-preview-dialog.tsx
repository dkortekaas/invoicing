'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Loader2 } from 'lucide-react';

interface EmailPreviewDialogProps {
  invoiceId: string;
  type: 'invoice' | 'reminder' | 'payment-confirmation';
  reminderType?: 'friendly' | 'first' | 'second' | 'final';
  trigger?: React.ReactNode;
}

export function EmailPreviewDialog({
  invoiceId,
  type,
  reminderType,
  trigger,
}: EmailPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setHtml(null);

    try {
      let url = `/api/email/preview/${type}?invoiceId=${invoiceId}`;
      if (type === 'reminder' && reminderType) {
        url += `&reminderType=${reminderType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Preview laden mislukt');
      }

      const htmlContent = await response.text();
      setHtml(htmlContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={handlePreview}>{trigger}</div>
      ) : (
        <Button onClick={handlePreview} variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Voorbeeld van hoe de email eruit zal zien
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border rounded-lg">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="p-4 text-red-600">
                {error}
              </div>
            )}

            {html && (
              <iframe
                srcDoc={html}
                className="w-full h-full min-h-[600px] border-0"
                title="Email preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
