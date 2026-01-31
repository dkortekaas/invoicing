'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CalendarIcon, Upload, X, FileText, Loader2, Info, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Expense } from '@prisma/client';
import { OcrPreview } from './ocr-preview';
import type { OcrResult, OcrExtractedData, ClassificationInfo } from '@/lib/ocr/types';

const expenseSchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'Beschrijving is verplicht'),
  category: z.string().min(1, 'Categorie is verplicht'),
  amount: z.number().min(0.01, 'Bedrag moet groter dan 0 zijn'),
  vatRate: z.number(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  deductible: z.boolean(),
  deductiblePerc: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CATEGORIES = [
  { value: 'OFFICE', label: 'Kantoorkosten' },
  { value: 'TRAVEL', label: 'Reiskosten' },
  { value: 'EQUIPMENT', label: 'Apparatuur' },
  { value: 'SOFTWARE', label: 'Software/Subscriptions' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EDUCATION', label: 'Opleiding' },
  { value: 'INSURANCE', label: 'Verzekeringen' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'TELECOM', label: 'Telefoon/Internet' },
  { value: 'UTILITIES', label: 'Energie' },
  { value: 'RENT', label: 'Huur' },
  { value: 'MAINTENANCE', label: 'Onderhoud' },
  { value: 'PROFESSIONAL', label: 'Professionele diensten' },
  { value: 'OTHER', label: 'Overig' },
];

// Serialized expense type (Decimal fields converted to numbers for client components)
type SerializedExpense = Omit<Expense, 'amount' | 'vatAmount' | 'vatRate' | 'netAmount' | 'deductiblePerc'> & {
  amount: number;
  vatAmount: number;
  vatRate: number;
  netAmount: number;
  deductiblePerc: number;
};

interface ExpenseFormProps {
  expense?: SerializedExpense;
  onSuccess?: () => void;
  useKOR?: boolean;
  hasOcrAccess?: boolean;
}

export function ExpenseForm({ expense, onSuccess, useKOR = false, hasOcrAccess = false }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(expense?.receipt || null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [showOcrPreview, setShowOcrPreview] = useState(false);

  // Categorization state
  const [classificationInfo, setClassificationInfo] = useState<ClassificationInfo | null>(null);
  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  const [wasAutoCategorized, setWasAutoCategorized] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      date: new Date(expense.date),
      description: expense.description,
      category: expense.category,
      amount: Number(expense.amount),
      vatRate: Number(expense.vatRate),
      supplier: expense.supplier || '',
      invoiceNumber: expense.invoiceNumber || '',
      deductible: useKOR ? false : expense.deductible,
      deductiblePerc: useKOR ? 0 : Number(expense.deductiblePerc),
      notes: expense.notes || '',
    } : {
      date: new Date(),
      description: '',
      category: '',
      amount: 0,
      vatRate: 21,
      deductible: useKOR ? false : true,
      deductiblePerc: useKOR ? 0 : 100,
    },
  });

  // Trigger OCR extraction for a given receipt URL
  const triggerOcrExtraction = async (url: string) => {
    // Only process if user has OCR access and file is PDF or image
    if (!hasOcrAccess) return;

    // Remove query parameters for extension check
    const urlPath = (url.split('?')[0] ?? url).toLowerCase();
    const isOcrSupported = urlPath.endsWith('.pdf') ||
      urlPath.endsWith('.png') ||
      urlPath.endsWith('.jpg') ||
      urlPath.endsWith('.jpeg') ||
      urlPath.endsWith('.webp');

    if (!isOcrSupported) return;

    setIsOcrProcessing(true);
    try {
      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: url }),
      });

      const result: OcrResult = await response.json();

      if (result.success && result.data) {
        setOcrResult(result);
        setShowOcrPreview(true);
      } else if (result.error) {
        toast.error(`OCR: ${result.error}`);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Fout bij automatisch herkennen van gegevens');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Apply OCR extracted data to the form
  const applyOcrData = (data: OcrExtractedData) => {
    if (data.date) {
      form.setValue('date', new Date(data.date));
    }
    if (data.amount !== undefined) {
      form.setValue('amount', data.amount);
    }
    if (data.vatRate !== undefined) {
      form.setValue('vatRate', data.vatRate);
    }
    if (data.supplier) {
      form.setValue('supplier', data.supplier);
    }
    if (data.invoiceNumber) {
      form.setValue('invoiceNumber', data.invoiceNumber);
    }
    if (data.description) {
      form.setValue('description', data.description);
    }
    if (data.suggestedCategory) {
      form.setValue('category', data.suggestedCategory);
      setPredictedCategory(data.suggestedCategory);
      setWasAutoCategorized(true);
    }

    // Store classification info for submission
    if (ocrResult?.classification) {
      setClassificationInfo(ocrResult.classification);
    }

    setShowOcrPreview(false);
    toast.success('Gegevens overgenomen uit factuur');
  };

  const handleReceiptUpload = async (file: File) => {
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (expense?.id) {
        formData.append('expenseId', expense.id);
      }

      const response = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fout bij uploaden bestand');
      }

      const data = await response.json();
      setReceiptUrl(data.url);
      toast.success('Bestand geüpload');

      // Trigger OCR extraction automatically after upload
      await triggerOcrExtraction(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Fout bij uploaden bestand');
    } finally {
      setIsUploadingReceipt(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Alleen PDF, afbeeldingen of Word documenten zijn toegestaan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximum 5MB toegestaan');
      return;
    }

    await handleReceiptUpload(file);
  };

  const handleRemoveReceipt = async () => {
    if (!expense?.id) {
      setReceiptUrl(null);
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove receipt');
      }

      setReceiptUrl(null);
      toast.success('Bestand verwijderd');
    } catch (error) {
      console.error('Remove receipt error:', error);
      toast.error('Fout bij verwijderen bestand');
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      const url = expense ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = expense ? 'PATCH' : 'POST';

      // Build request body with categorization data
      const requestBody: Record<string, unknown> = {
        ...data,
        receipt: receiptUrl,
      };

      // Include categorization info for new expenses
      if (!expense && wasAutoCategorized) {
        requestBody.wasAutoCategorized = true;
        requestBody.predictedCategory = predictedCategory;
        requestBody.categorySource = classificationInfo?.source || null;
        requestBody.vendorId = classificationInfo?.vendorId || null;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/kosten');
        router.refresh();
      }
      toast.success(expense ? 'Kosten bijgewerkt' : 'Kosten toegevoegd');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expense?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.success('Uitgave verwijderd');
      setIsDeleteDialogOpen(false);
      router.push('/kosten');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Er is een fout opgetreden bij het verwijderen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Datum *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: nl })
                        ) : (
                          <span>Kies een datum</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={nl}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categorie *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschrijving *</FormLabel>
              <FormControl>
                <Input placeholder="Bijv. Laptop voor werk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrag (incl. BTW) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vatRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BTW% *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseFloat(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="9">9%</SelectItem>
                    <SelectItem value="21">21%</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {!useKOR && (
            <FormField
              control={form.control}
              name="deductiblePerc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aftrekbaar %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage BTW dat aftrekbaar is
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leverancier</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Naam leverancier" 
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Factuurnummer</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Factuurnummer leverancier" 
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notities</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Extra informatie" 
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {useKOR ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Je maakt gebruik van de kleineondernemersregeling (KOR). BTW op uitgaven is niet aftrekbaar.
              De kosten zijn wel aftrekbaar voor de inkomstenbelasting.
            </AlertDescription>
          </Alert>
        ) : (
          <FormField
            control={form.control}
            name="deductible"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">BTW aftrekbaar</FormLabel>
                  <FormDescription>
                    Is de BTW op deze uitgave aftrekbaar?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormItem>
          <FormLabel>Factuur/Bon</FormLabel>
          <div className="space-y-4">
            {receiptUrl && (
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Bestand geüpload</p>
                  <Link
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Bekijk bestand
                  </Link>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveReceipt}
                  disabled={isUploadingReceipt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* OCR Processing indicator */}
            {isOcrProcessing && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">Gegevens worden herkend...</p>
                  <p className="text-xs text-muted-foreground">
                    We analyseren je factuur of bon
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={handleFileSelect}
                disabled={isUploadingReceipt || loading || isOcrProcessing}
                className="hidden"
                id="receipt-upload"
              />
              <Label
                htmlFor="receipt-upload"
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingReceipt || loading || isOcrProcessing}
                  asChild
                >
                  <span>
                    {isUploadingReceipt ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploaden...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {receiptUrl ? 'Bestand wijzigen' : 'Factuur/Bon uploaden'}
                      </>
                    )}
                  </span>
                </Button>
              </Label>
            </div>
            <FormDescription>
              Upload een PDF, afbeelding of Word document van de factuur of bon. Maximaal 5MB.
              {hasOcrAccess && (
                <span className="flex items-center gap-1 mt-1 text-primary">
                  <Sparkles className="h-3 w-3" />
                  Gegevens worden automatisch herkend (Pro)
                </span>
              )}
            </FormDescription>
          </div>
        </FormItem>

        {/* OCR Preview Dialog */}
        {ocrResult?.data && (
          <OcrPreview
            open={showOcrPreview}
            onOpenChange={setShowOcrPreview}
            data={ocrResult.data}
            confidence={ocrResult.confidence}
            classification={ocrResult.classification}
            onApply={() => applyOcrData(ocrResult.data!)}
            onSkip={() => setShowOcrPreview(false)}
          />
        )}

        <div className="flex justify-between gap-4">
          {expense?.id ? (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={loading}
              >
                Verwijderen
              </Button>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Uitgave verwijderen</DialogTitle>
                    <DialogDescription>
                      Weet je zeker dat je deze uitgave wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex justify-end gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={loading}
                    >
                      Annuleren
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Verwijderen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <span />
          )}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
