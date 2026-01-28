// Types for import/export functionality

export type FieldType =
  | 'string'
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'currency'
  | 'decimal'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'vatNumber'
  | 'kvkNumber'
  | 'iban'
  | 'postalCode'
  | 'country';

export interface FieldDefinition {
  label: string;
  required: boolean;
  type: FieldType;
  maxLength?: number;
  aliases: string[];
  default?: unknown;
  enumValues?: string[];
  categoryMapping?: Record<string, string>;
  lookupField?: string;
  isLineItem?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx';
  columns?: string[];
  filters?: {
    ids?: string[];
    dateFrom?: string;
    dateTo?: string;
    status?: string[];
    [key: string]: unknown;
  };
  options?: {
    includeHeader?: boolean;
    dateFormat?: 'nl' | 'iso';
    decimalSeparator?: ',' | '.';
    encoding?: 'utf-8' | 'windows-1252';
  };
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  duplicateCheckField?: string;
}

export interface ValidationDetail {
  row: number;
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: number;
  warnings: number;
  errors: number;
  details: ValidationDetail[];
  preview: Record<string, unknown>[];
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
  details: {
    row: number;
    status: 'success' | 'skipped' | 'error';
    message?: string;
    recordId?: string;
  }[];
}

export interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
}
