export interface OcrExtractedData {
  supplier?: string;
  invoiceNumber?: string;
  date?: string; // ISO format YYYY-MM-DD
  amount?: number; // Totaal incl. BTW
  vatAmount?: number;
  vatRate?: number; // 0, 9, of 21
  description?: string;
  suggestedCategory?: string;
}

export interface OcrResult {
  success: boolean;
  data?: OcrExtractedData;
  confidence: number; // 0.0 - 1.0
  error?: string;
}

export type SupportedFileType = 'pdf' | 'image';
