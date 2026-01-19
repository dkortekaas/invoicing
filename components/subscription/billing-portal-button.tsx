'use client';

import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Settings className="mr-2 h-4 w-4" />
      )}
      Beheer abonnement
    </Button>
  );
}
