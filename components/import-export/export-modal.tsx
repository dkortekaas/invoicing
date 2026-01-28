'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ENTITY_LABELS, type EntityType, getExportColumnsForEntity, getFieldsForEntity } from '@/lib/import-export/fields';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  selectedIds?: string[];
  totalCount?: number;
}

export function ExportModal({
  open,
  onOpenChange,
  entityType,
  selectedIds,
  totalCount,
}: ExportModalProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [dutchFormat, setDutchFormat] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fields = getFieldsForEntity(entityType);
  const defaultColumns = getExportColumnsForEntity(entityType);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);

  const entityLabel = ENTITY_LABELS[entityType];

  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(Object.keys(fields));
  };

  const handleSelectNoColumns = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Selecteer minimaal 1 kolom');
      return;
    }

    setIsExporting(true);

    try {
      const endpoint = `/api/export/${entityType.toLowerCase().replace('_', '-')}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          columns: selectedColumns,
          filters: exportScope === 'selected' && selectedIds ? { ids: selectedIds } : undefined,
          options: {
            includeHeader,
            dateFormat: dutchFormat ? 'nl' : 'iso',
            decimalSeparator: dutchFormat ? ',' : '.',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export mislukt');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || `export.${format}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Export gedownload');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Export mislukt');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exporteren</DialogTitle>
          <DialogDescription>
            Exporteer {entityLabel.toLowerCase()} naar Excel of CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scope selection */}
          {selectedIds && selectedIds.length > 0 && (
            <div className="space-y-3">
              <Label>Wat exporteren</Label>
              <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as 'all' | 'selected')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">
                    Alle {entityLabel.toLowerCase()} {totalCount && `(${totalCount})`}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="font-normal">
                    Geselecteerde {entityLabel.toLowerCase()} ({selectedIds.length})
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Format selection */}
          <div className="space-y-3">
            <Label>Formaat</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'xlsx' | 'csv')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="font-normal">
                  Excel (.xlsx) - Aanbevolen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal">
                  CSV (.csv) - Voor andere software
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Opties</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeader"
                  checked={includeHeader}
                  onCheckedChange={(checked) => setIncludeHeader(checked === true)}
                />
                <Label htmlFor="includeHeader" className="font-normal">
                  Inclusief kolomnamen (header rij)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dutchFormat"
                  checked={dutchFormat}
                  onCheckedChange={(checked) => setDutchFormat(checked === true)}
                />
                <Label htmlFor="dutchFormat" className="font-normal">
                  Nederlandse notatie (DD-MM-YYYY, komma als decimaal)
                </Label>
              </div>
            </div>
          </div>

          {/* Column selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Kolommen</Label>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllColumns}
                >
                  Alles
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectNoColumns}
                >
                  Niets
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {Object.entries(fields).map(([key, field]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={selectedColumns.includes(key)}
                    onCheckedChange={() => handleColumnToggle(key)}
                  />
                  <Label htmlFor={`col-${key}`} className="font-normal text-sm">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Exporteren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
