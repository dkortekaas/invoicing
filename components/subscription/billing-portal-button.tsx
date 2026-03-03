'use client';

import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from '@/components/providers/locale-provider';

export function BillingPortalButton() {
  const { t } = useTranslations('subscriptionPage');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const { url } = await response.json();

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(t('errorGeneric'));
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
      {t('manageSubscription')}
    </Button>
  );
}
