'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import type { OcrExtractedData } from '@/lib/ocr/types';

interface OcrPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OcrExtractedData;
  confidence: number;
  onApply: () => void;
  onSkip: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  OFFICE: 'Kantoorkosten',
  TRAVEL: 'Reiskosten',
  EQUIPMENT: 'Apparatuur',
  SOFTWARE: 'Software/Subscriptions',
  MARKETING: 'Marketing',
  EDUCATION: 'Opleiding',
  INSURANCE: 'Verzekeringen',
  ACCOUNTANT: 'Accountant',
  TELECOM: 'Telefoon/Internet',
  UTILITIES: 'Energie',
  RENT: 'Huur',
  MAINTENANCE: 'Onderhoud',
  PROFESSIONAL: 'Professionele diensten',
  OTHER: 'Overig',
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.7) {
    return (
      <Badge variant="default" className="bg-green-600">
        <Check className="mr-1 h-3 w-3" />
        Hoge betrouwbaarheid
      </Badge>
    );
  }
  if (confidence >= 0.4) {
    return (
      <Badge variant="secondary" className="bg-yellow-500 text-white">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Gemiddelde betrouwbaarheid
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <X className="mr-1 h-3 w-3" />
      Lage betrouwbaarheid
    </Badge>
  );
}

function DataRow({
  label,
  value,
  isEmpty,
}: {
  label: string;
  value: string | undefined;
  isEmpty?: boolean;
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={isEmpty ? 'text-muted-foreground italic' : 'font-medium'}>
        {isEmpty ? 'Niet herkend' : value}
      </span>
    </div>
  );
}

export function OcrPreview({
  open,
  onOpenChange,
  data,
  confidence,
  onApply,
  onSkip,
}: OcrPreviewProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return undefined;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    try {
      return format(new Date(dateStr), 'PPP', { locale: nl });
    } catch {
      return dateStr;
    }
  };

  const hasAnyData =
    data.supplier ||
    data.invoiceNumber ||
    data.date ||
    data.amount !== undefined ||
    data.vatAmount !== undefined ||
    data.vatRate !== undefined ||
    data.description ||
    data.suggestedCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Herkende Gegevens
          </DialogTitle>
          <DialogDescription>
            De volgende gegevens zijn herkend uit je factuur of bon.
            Controleer de gegevens voordat je ze overneemt.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center mb-4">
            <ConfidenceBadge confidence={confidence} />
          </div>

          {!hasAnyData ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2 text-yellow-500" />
              <p>Geen gegevens kunnen worden herkend.</p>
              <p className="text-sm">Probeer een duidelijkere afbeelding te uploaden.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <DataRow
                label="Leverancier"
                value={data.supplier}
                isEmpty={!data.supplier}
              />
              <Separator />
              <DataRow
                label="Factuurnummer"
                value={data.invoiceNumber}
                isEmpty={!data.invoiceNumber}
              />
              <Separator />
              <DataRow
                label="Datum"
                value={formatDate(data.date)}
                isEmpty={!data.date}
              />
              <Separator />
              <DataRow
                label="Bedrag (incl. BTW)"
                value={formatCurrency(data.amount)}
                isEmpty={data.amount === undefined}
              />
              <Separator />
              <DataRow
                label="BTW bedrag"
                value={formatCurrency(data.vatAmount)}
                isEmpty={data.vatAmount === undefined}
              />
              <Separator />
              <DataRow
                label="BTW tarief"
                value={data.vatRate !== undefined ? `${data.vatRate}%` : undefined}
                isEmpty={data.vatRate === undefined}
              />
              <Separator />
              <DataRow
                label="Beschrijving"
                value={data.description}
                isEmpty={!data.description}
              />
              {data.suggestedCategory && (
                <>
                  <Separator />
                  <DataRow
                    label="Categorie suggestie"
                    value={CATEGORY_LABELS[data.suggestedCategory] || data.suggestedCategory}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onSkip}>
            Overslaan
          </Button>
          <Button onClick={onApply} disabled={!hasAnyData}>
            <Check className="mr-2 h-4 w-4" />
            Gegevens Overnemen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
