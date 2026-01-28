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
        throw new Error('Pauzeren mislukt');
      }

      setPauseDialogOpen(null);
      router.refresh();
      toast.success('Abonnement gepauzeerd');
    } catch (error) {
      console.error('Pause error:', error);
      toast.error('Er is een fout opgetreden bij het pauzeren');
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
        throw new Error('Hervatten mislukt');
      }

      router.refresh();
      toast.success('Abonnement hervat');
    } catch (error) {
      console.error('Resume error:', error);
      toast.error('Er is een fout opgetreden bij het hervatten');
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
        throw new Error('Genereren mislukt');
      }

      const invoice = await response.json();
      setGenerateDialogOpen(null);
      toast.success('Factuur gegenereerd');
      router.push(`/facturen/${invoice.id}`);
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Er is een fout opgetreden bij het genereren');
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
        throw new Error('Verwijderen mislukt');
      }

      setDeleteDialogOpen(null);
      router.refresh();
      toast.success('Abonnement verwijderd');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Er is een fout opgetreden bij het verwijderen');
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
            <DialogTitle>Abonnement verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit abonnement wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(null)}
              disabled={_loading !== null}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
              disabled={_loading !== null}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pauseDialogOpen !== null} onOpenChange={(open) => !open && setPauseDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonnement pauzeren</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit abonnement wilt pauzeren? Er worden geen nieuwe facturen meer gegenereerd totdat je het abonnement hervat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPauseDialogOpen(null)}
              disabled={_loading !== null}
            >
              Annuleren
            </Button>
            <Button
              onClick={() => pauseDialogOpen && handlePause(pauseDialogOpen)}
              disabled={_loading !== null}
            >
              Pauzeren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateDialogOpen !== null} onOpenChange={(open) => !open && setGenerateDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factuur genereren</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je nu een factuur wilt genereren? Dit wordt direct aangemaakt en je wordt doorgestuurd naar de factuur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(null)}
              disabled={_loading !== null}
            >
              Annuleren
            </Button>
            <Button
              onClick={() => generateDialogOpen && handleGenerate(generateDialogOpen)}
              disabled={_loading !== null}
            >
              Genereren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
