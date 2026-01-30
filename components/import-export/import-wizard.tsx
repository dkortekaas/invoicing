'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ENTITY_LABELS, type EntityType, getFieldsForEntity } from '@/lib/import-export/fields';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEntityType?: EntityType;
  onImportComplete?: () => void;
}

interface UploadResult {
  jobId: string;
  fileName: string;
  totalRows: number;
  columns: string[];
  sampleData: Record<string, unknown>[];
  suggestedMapping: Record<string, string>;
}

interface ValidationResult {
  valid: number;
  warnings: number;
  errors: number;
  details: Array<{
    row: number;
    field: string;
    value: unknown;
    message: string;
    severity: 'error' | 'warning';
  }>;
  preview: Record<string, unknown>[];
}

interface ImportResultData {
  success: number;
  skipped: number;
  errors: number;
  details: Array<{
    row: number;
    status: string;
    message?: string;
    recordId?: string;
  }>;
}

const STEPS = ['Upload', 'Kolommen', 'Validatie', 'Resultaat'];

export function ImportWizard({
  open,
  onOpenChange,
  defaultEntityType,
  onImportComplete,
}: ImportWizardProps) {
  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState<EntityType>(defaultEntityType || 'CUSTOMERS');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Step 1: Upload
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Step 2: Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Step 3: Validation
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);

  // Step 4: Result
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const fields = getFieldsForEntity(entityType);

  const handleClose = () => {
    setStep(0);
    setUploadResult(null);
    setColumnMapping({});
    setValidationResult(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload mislukt');
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);
      setColumnMapping(result.suggestedMapping);
      setStep(1);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload mislukt');
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleValidate = async () => {
    if (!uploadResult) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/import/${uploadResult.jobId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnMapping,
          options: {
            skipDuplicates,
            updateExisting,
            duplicateCheckField: entityType === 'CUSTOMERS' ? 'email' : entityType === 'INVOICES' ? 'invoiceNumber' : 'name',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validatie mislukt');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);
      setStep(2);
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Validatie mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!uploadResult) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/import/${uploadResult.jobId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import mislukt');
      }

      const result: ImportResultData = await response.json();
      setImportResult(result);
      setStep(3);
      onImportComplete?.();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Import mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    const url = `/api/export/template/${entityType.toLowerCase()}?format=${format}`;
    window.open(url, '_blank');
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderMappingStep();
      case 2:
        return renderValidationStep();
      case 3:
        return renderResultStep();
      default:
        return null;
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Wat wil je importeren?</Label>
        <RadioGroup value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={key} id={key} />
              <Label htmlFor={key} className="font-normal">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isLoading && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isLoading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {isLoading ? (
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
          ) : (
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Sleep een Excel of CSV bestand hierheen
          </p>
          <p className="text-sm text-muted-foreground">of klik om te selecteren</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ondersteund: .xlsx, .xls, .csv
          </p>
        </label>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">Download een voorbeeld template:</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate('xlsx')}>
            <Download className="mr-2 h-4 w-4" />
            Excel template
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV template
          </Button>
        </div>
      </div>
    </div>
  );

  const renderMappingStep = () => {
    if (!uploadResult) return null;

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Koppel de kolommen uit je bestand aan de juiste velden.
        </p>

        <div className="border rounded-md max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Kolom in bestand</TableHead>
                <TableHead className="w-1/2">Veld in systeem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadResult.columns.map((col) => (
                <TableRow key={col}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{col}</div>
                      {uploadResult.sampleData[0] && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          Bijv: {String(uploadResult.sampleData[0][col] || '-')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={columnMapping[col] || '_skip'}
                      onValueChange={(value) =>
                        setColumnMapping((prev) => ({ ...prev, [col]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_skip">-- Overslaan --</SelectItem>
                        {Object.entries(fields).map(([key, field]) => (
                          <SelectItem key={key} value={key}>
                            {field.label}
                            {field.required && ' *'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">* = verplicht veld</p>
      </div>
    );
  };

  const renderValidationStep = () => {
    if (!validationResult) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <div className="mt-2 text-2xl font-bold">{validationResult.valid}</div>
            <div className="text-sm text-muted-foreground">Geldig</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
            <div className="mt-2 text-2xl font-bold">{validationResult.warnings}</div>
            <div className="text-sm text-muted-foreground">Waarschuwingen</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <div className="mt-2 text-2xl font-bold">{validationResult.errors}</div>
            <div className="text-sm text-muted-foreground">Fouten</div>
          </div>
        </div>

        {validationResult.details.length > 0 && (
          <div className="border rounded-md max-h-[150px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rij</TableHead>
                  <TableHead>Veld</TableHead>
                  <TableHead>Probleem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResult.details.slice(0, 20).map((detail, i) => (
                  <TableRow key={i}>
                    <TableCell>{detail.row}</TableCell>
                    <TableCell>{detail.field}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {detail.severity === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {detail.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="space-y-2">
          <Label>Import opties</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipDuplicates"
              checked={skipDuplicates}
              onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
            />
            <Label htmlFor="skipDuplicates" className="font-normal">
              Sla duplicaten over
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="updateExisting"
              checked={updateExisting}
              onCheckedChange={(checked) => setUpdateExisting(checked === true)}
            />
            <Label htmlFor="updateExisting" className="font-normal">
              Update bestaande bij duplicaat
            </Label>
          </div>
        </div>
      </div>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    const hasErrors = importResult.errors > 0;
    const hasSuccess = importResult.success > 0;

    return (
      <div className="space-y-4">
        <div className="text-center">
          {hasErrors && !hasSuccess ? (
            <>
              <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
              <h3 className="text-lg font-semibold mt-2">Import mislukt</h3>
            </>
          ) : hasErrors ? (
            <>
              <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
              <h3 className="text-lg font-semibold mt-2">Import voltooid met waarschuwingen</h3>
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold mt-2">Import voltooid</h3>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
            <div className="text-sm text-muted-foreground">Geïmporteerd</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
            <div className="text-sm text-muted-foreground">Overgeslagen</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
            <div className="text-sm text-muted-foreground">Mislukt</div>
          </div>
        </div>

        {importResult.details.length > 0 && (
          <div className="border rounded-md max-h-[260px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rij</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bericht</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResult.details.slice(0, 20).map((detail, i) => (
                  <TableRow key={i}>
                    <TableCell>{detail.row}</TableCell>
                    <TableCell>
                      {detail.status === 'success' ? (
                        <Badge variant="default" className="bg-green-500">Succes</Badge>
                      ) : detail.status === 'skipped' ? (
                        <Badge variant="secondary">Overgeslagen</Badge>
                      ) : (
                        <Badge variant="destructive">Fout</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex items-start gap-2 max-w-xs text-left whitespace-normal break-words">
                      {detail.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {detail.message || (detail.status === 'success' ? 'Geïmporteerd' : 'Onbekend')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importeren</DialogTitle>
          <DialogDescription>
            Stap {step + 1} van {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        <Progress value={(step / (STEPS.length - 1)) * 100} className="h-2" />

        <div className="py-4">{renderStep()}</div>

        <DialogFooter>
          {step > 0 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Vorige
            </Button>
          )}

          <div className="flex-1" />

          <Button variant="outline" onClick={handleClose}>
            {step === 3 ? 'Sluiten' : 'Annuleren'}
          </Button>

          {step === 1 && (
            <Button onClick={handleValidate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Valideren
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 2 && (
            <Button onClick={handleImport} disabled={isLoading || validationResult?.valid === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Importeren
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
