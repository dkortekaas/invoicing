'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface UpgradeBannerProps {
  feature?: string;
}

export function UpgradeBanner({ feature }: UpgradeBannerProps) {
  return (
    <Alert className="border-primary bg-primary/5">
      <Sparkles className="h-5 w-5 text-primary" />
      <AlertTitle>Upgrade naar Pro</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {feature 
            ? `${feature} is alleen beschikbaar in het Pro plan.` 
            : 'Unlock alle premium features met een Pro abonnement.'}
        </span>
        <Button asChild size="sm" className="ml-4">
          <Link href="/upgrade">Upgrade nu</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
