'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const handlePause = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit abonnement wilt pauzeren?')) {
      return;
    }

    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Pauzeren mislukt');
      }

      router.refresh();
    } catch (error) {
      console.error('Pause error:', error);
      alert('Er is een fout opgetreden bij het pauzeren');
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
    } catch (error) {
      console.error('Resume error:', error);
      alert('Er is een fout opgetreden bij het hervatten');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerate = async (id: string) => {
    if (!confirm('Weet je zeker dat je nu een factuur wilt genereren?')) {
      return;
    }

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
      router.push(`/facturen/${invoice.id}`);
    } catch (error) {
      console.error('Generate error:', error);
      alert('Er is een fout opgetreden bij het genereren');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit abonnement wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setLoading(id);
    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Verwijderen mislukt');
      }

      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Er is een fout opgetreden bij het verwijderen');
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
            onPause={handlePause}
            onResume={handleResume}
            onGenerate={handleGenerate}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </>
  );
}
