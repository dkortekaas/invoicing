'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';
import type { EntityType } from '@/lib/import-export/fields';
import { useTranslations } from '@/components/providers/locale-provider';

interface ExportButtonProps {
  entityType: EntityType;
  totalCount?: number;
  selectedIds?: string[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
  entityType,
  totalCount,
  selectedIds,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslations('exportModal');

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Download className="mr-2 h-4 w-4" />
        {t('exportButton')}
      </Button>
      <ExportModal
        open={open}
        onOpenChange={setOpen}
        entityType={entityType}
        totalCount={totalCount}
        selectedIds={selectedIds}
      />
    </>
  );
}
