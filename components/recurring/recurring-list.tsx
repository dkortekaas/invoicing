'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RecurringCard } from './recurring-card';
import { useTranslations } from '@/components/providers/locale-provider';

interface RecurringListProps {
  recurring: Array<{
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
  }>;
}

export function RecurringList({ recurring }: RecurringListProps) {
  const router = useRouter();
  const { t } = useTranslations('recurringPage');
  const [_loading, setLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<string | null>(null);

  const handlePause = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(t('pauseError'));
      }

      setPauseDialogOpen(null);
      router.refresh();
      toast.success(t('pauseSuccess'));
    } catch (error) {
      console.error('Pause error:', error);
      toast.error(t('pauseError'));
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}/resume`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(t('resumeError'));
      }

      router.refresh();
      toast.success(t('resumeSuccess'));
    } catch (error) {
      console.error('Resume error:', error);
      toast.error(t('resumeError'));
    } finally {
      setLoading(null);
    }
  };

  const handleGenerate = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: false }),
      });

      if (!response.ok) {
        throw new Error(t('generateError'));
      }

      const invoice = await response.json();
      setGenerateDialogOpen(null);
      toast.success(t('generateSuccess'));
      router.push(`/facturen/${invoice.id}`);
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(t('generateError'));
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t('deleteError'));
      }

      setDeleteDialogOpen(null);
      router.refresh();
      toast.success(t('deleteSuccess'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('deleteError'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {recurring.map(r => (
        <div key={r.id}>
          <RecurringCard
            recurring={r}
            onPause={(id) => setPauseDialogOpen(id)}
            onResume={handleResume}
            onGenerate={(id) => setGenerateDialogOpen(id)}
            onDelete={(id) => setDeleteDialogOpen(id)}
          />
        </div>
      ))}

      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription>{t('deleteDialogDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(null)}
              disabled={_loading !== null}
            >
              {t('cancelButton')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
              disabled={_loading !== null}
            >
              {t('deleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pauseDialogOpen !== null} onOpenChange={(open) => !open && setPauseDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pauseDialogTitle')}</DialogTitle>
            <DialogDescription>{t('pauseDialogDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPauseDialogOpen(null)}
              disabled={_loading !== null}
            >
              {t('cancelButton')}
            </Button>
            <Button
              onClick={() => pauseDialogOpen && handlePause(pauseDialogOpen)}
              disabled={_loading !== null}
            >
              {t('pauseButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateDialogOpen !== null} onOpenChange={(open) => !open && setGenerateDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('generateDialogTitle')}</DialogTitle>
            <DialogDescription>{t('generateDialogDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(null)}
              disabled={_loading !== null}
            >
              {t('cancelButton')}
            </Button>
            <Button
              onClick={() => generateDialogOpen && handleGenerate(generateDialogOpen)}
              disabled={_loading !== null}
            >
              {t('generateButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
