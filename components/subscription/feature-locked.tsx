'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeatureLockedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  description?: string;
  requiredTier?: string;
}

export function FeatureLocked({
  open,
  onOpenChange,
  featureName,
  description,
  requiredTier,
}: FeatureLockedProps) {
  const router = useRouter();

  const tierLabel = requiredTier || 'betaald';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {featureName} vereist een {tierLabel} abonnement
          </DialogTitle>
          <DialogDescription className="text-center">
            {description ||
              `Upgrade naar ${tierLabel} of hoger om toegang te krijgen tot ${featureName} en andere premium features.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={() => router.push('/upgrade')}>
            Bekijk abonnementen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
