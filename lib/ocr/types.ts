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

export interface ClassificationInfo {
  category: string;
  source: 'MANUAL' | 'VENDOR_MATCH' | 'KEYWORD_MATCH' | 'AI_PREDICTION';
  confidence: number;
  explanation: string;
  vendorId?: string;
  vendorName?: string;
}

export interface OcrResult {
  success: boolean;
  data?: OcrExtractedData;
  confidence: number; // 0.0 - 1.0
  error?: string;
  classification?: ClassificationInfo;
}

export type SupportedFileType = 'pdf' | 'image';
