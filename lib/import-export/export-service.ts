import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { db } from '@/lib/db';
import type { ExportOptions } from './types';
import {
  CUSTOMER_FIELDS,
  CUSTOMER_EXPORT_COLUMNS,
  INVOICE_FIELDS,
  INVOICE_EXPORT_COLUMNS,
  EXPENSE_FIELDS,
  EXPENSE_EXPORT_COLUMNS,
  EXPENSE_CATEGORY_LABELS,
  PRODUCT_FIELDS,
  PRODUCT_EXPORT_COLUMNS,
  TIME_ENTRY_FIELDS,
  TIME_ENTRY_EXPORT_COLUMNS,
} from './fields';
import type { FieldDefinition } from './types';
import type { InvoiceStatus, ExpenseCategory } from '@prisma/client';

type FormatOptions = ExportOptions['options'];

// Helper type for Decimal values from Prisma
interface DecimalLike {
  toNumber(): number;
}

// Helper om waarde te formatteren voor export
function formatValue(
  value: unknown,
  fieldType: FieldDefinition['type'],
  options?: FormatOptions
): string | number {
  if (value === null || value === undefined) return '';

  const dateFormat = options?.dateFormat || 'nl';
  const decimalSep = options?.decimalSeparator || ',';

  switch (fieldType) {
    case 'date':
      if (value instanceof Date) {
        if (dateFormat === 'nl') {
          return format(value, 'dd-MM-yyyy', { locale: nl });
        }
        return format(value, 'yyyy-MM-dd');
      }
      return String(value);

    case 'currency':
    case 'decimal': {
      let num: number;
      if (typeof value === 'object' && value !== null && 'toNumber' in value) {
        num = (value as DecimalLike).toNumber();
      } else if (typeof value === 'number') {
        num = value;
      } else {
        return String(value);
      }

      if (decimalSep === ',') {
        return num.toFixed(2).replace('.', ',');
      }
      return num.toFixed(2);
    }

    case 'integer':
      return typeof value === 'number' ? value : parseInt(String(value), 10);

    case 'boolean':
      return value ? 'Ja' : 'Nee';

    default:
      return String(value);
  }
}

// Generate Excel file
async function generateExcel(
  columns: string[],
  rows: Record<string, unknown>[],
  sheetName: string,
  fields: Record<string, FieldDefinition>,
  options?: FormatOptions
): Promise<Buffer> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Headers
  const headers = columns.map((col) => {
    const field = fields[col];
    return field?.label || col;
  });

  if (options?.includeHeader !== false) {
    worksheet.addRow(headers);

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  }

  // Data rows
  for (const row of rows) {
    const values = headers.map((header) => row[header] ?? '');
    worksheet.addRow(values);
  }

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value?.toString().length || 0;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Generate CSV file
function generateCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  fields: Record<string, FieldDefinition>,
  options?: FormatOptions
): Buffer {
  const headers = columns.map((col) => {
    const field = fields[col];
    return field?.label || col;
  });

  const lines: string[] = [];

  if (options?.includeHeader !== false) {
    lines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';'));
  }

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const strValue = String(value).replace(/"/g, '""');
      return `"${strValue}"`;
    });
    lines.push(values.join(';'));
  }

  // BOM for UTF-8 in Excel
  const bom = '\uFEFF';
  return Buffer.from(bom + lines.join('\r\n'), 'utf-8');
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export async function exportCustomers(
  userId: string,
  options: ExportOptions
): Promise<Buffer> {
  const customers = await db.customer.findMany({
    where: {
      userId,
      ...(options.filters?.ids ? { id: { in: options.filters.ids } } : {}),
    },
    orderBy: { name: 'asc' },
  });

  const columns = options.columns || CUSTOMER_EXPORT_COLUMNS;

  // Map naar export formaat
  const rows = customers.map((customer) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const field = CUSTOMER_FIELDS[col];
      if (!field) continue;

      const value = customer[col as keyof typeof customer];
      row[field.label] = formatValue(value, field.type, options.options);
    }
    return row;
  });

  if (options.format === 'xlsx') {
    return generateExcel(columns, rows, 'Klanten', CUSTOMER_FIELDS, options.options);
  } else {
    return generateCsv(columns, rows, CUSTOMER_FIELDS, options.options);
  }
}

export async function exportInvoices(
  userId: string,
  options: ExportOptions
): Promise<Buffer> {
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      ...(options.filters?.ids ? { id: { in: options.filters.ids } } : {}),
      ...(options.filters?.status
        ? { status: { in: options.filters.status as InvoiceStatus[] } }
        : {}),
      ...(options.filters?.dateFrom
        ? { invoiceDate: { gte: new Date(options.filters.dateFrom) } }
        : {}),
      ...(options.filters?.dateTo
        ? { invoiceDate: { lte: new Date(options.filters.dateTo) } }
        : {}),
    },
    include: {
      customer: true,
    },
    orderBy: { invoiceDate: 'desc' },
  });

  const columns = options.columns || INVOICE_EXPORT_COLUMNS;

  const rows = invoices.map((invoice) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const field = INVOICE_FIELDS[col];
      if (!field) continue;

      let value: unknown;
      switch (col) {
        case 'customerEmail':
          value = invoice.customer?.email;
          break;
        case 'customerName':
          value = invoice.customer?.name;
          break;
        default:
          value = invoice[col as keyof typeof invoice];
      }

      row[field.label] = formatValue(value, field.type, options.options);
    }
    return row;
  });

  if (options.format === 'xlsx') {
    return generateExcel(columns, rows, 'Facturen', INVOICE_FIELDS, options.options);
  } else {
    return generateCsv(columns, rows, INVOICE_FIELDS, options.options);
  }
}

export async function exportExpenses(
  userId: string,
  options: ExportOptions
): Promise<Buffer> {
  const expenses = await db.expense.findMany({
    where: {
      userId,
      ...(options.filters?.ids ? { id: { in: options.filters.ids } } : {}),
      ...(options.filters?.category
        ? { category: { in: options.filters.category as ExpenseCategory[] } }
        : {}),
      ...(options.filters?.dateFrom
        ? { date: { gte: new Date(options.filters.dateFrom) } }
        : {}),
      ...(options.filters?.dateTo
        ? { date: { lte: new Date(options.filters.dateTo) } }
        : {}),
    },
    include: {
      project: true,
      customer: true,
    },
    orderBy: { date: 'desc' },
  });

  const columns = options.columns || EXPENSE_EXPORT_COLUMNS;

  const rows = expenses.map((expense) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const field = EXPENSE_FIELDS[col];
      if (!field) continue;

      let value: unknown;
      switch (col) {
        case 'projectName':
          value = expense.project?.name;
          break;
        case 'customerName':
          value = expense.customer?.name;
          break;
        case 'category':
          // Vertaal enum naar Nederlands
          value = EXPENSE_CATEGORY_LABELS[expense.category] || expense.category;
          break;
        default:
          value = expense[col as keyof typeof expense];
      }

      row[field.label] = formatValue(value, field.type, options.options);
    }
    return row;
  });

  if (options.format === 'xlsx') {
    return generateExcel(columns, rows, 'Onkosten', EXPENSE_FIELDS, options.options);
  } else {
    return generateCsv(columns, rows, EXPENSE_FIELDS, options.options);
  }
}

export async function exportProducts(
  userId: string,
  options: ExportOptions
): Promise<Buffer> {
  const products = await db.product.findMany({
    where: {
      userId,
      ...(options.filters?.ids ? { id: { in: options.filters.ids } } : {}),
      ...(options.filters?.isActive !== undefined
        ? { isActive: options.filters.isActive === 'true' }
        : {}),
    },
    orderBy: { name: 'asc' },
  });

  const columns = options.columns || PRODUCT_EXPORT_COLUMNS;

  const rows = products.map((product) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const field = PRODUCT_FIELDS[col];
      if (!field) continue;

      const value = product[col as keyof typeof product];
      row[field.label] = formatValue(value, field.type, options.options);
    }
    return row;
  });

  if (options.format === 'xlsx') {
    return generateExcel(columns, rows, 'Producten', PRODUCT_FIELDS, options.options);
  } else {
    return generateCsv(columns, rows, PRODUCT_FIELDS, options.options);
  }
}

export async function exportTimeEntries(
  userId: string,
  options: ExportOptions
): Promise<Buffer> {
  const timeEntries = await db.timeEntry.findMany({
    where: {
      userId,
      ...(options.filters?.ids ? { id: { in: options.filters.ids } } : {}),
      ...(options.filters?.billable !== undefined
        ? { billable: options.filters.billable === 'true' }
        : {}),
      ...(options.filters?.invoiced !== undefined
        ? { invoiced: options.filters.invoiced === 'true' }
        : {}),
      ...(options.filters?.dateFrom
        ? { startTime: { gte: new Date(options.filters.dateFrom) } }
        : {}),
      ...(options.filters?.dateTo
        ? { startTime: { lte: new Date(options.filters.dateTo) } }
        : {}),
    },
    include: {
      customer: true,
      project: true,
    },
    orderBy: { startTime: 'desc' },
  });

  const columns = options.columns || TIME_ENTRY_EXPORT_COLUMNS;

  const rows = timeEntries.map((entry) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const field = TIME_ENTRY_FIELDS[col];
      if (!field) continue;

      let value: unknown;
      switch (col) {
        case 'customerName':
          value = entry.customer?.name;
          break;
        case 'projectName':
          value = entry.project?.name;
          break;
        default:
          value = entry[col as keyof typeof entry];
      }

      row[field.label] = formatValue(value, field.type, options.options);
    }
    return row;
  });

  if (options.format === 'xlsx') {
    return generateExcel(columns, rows, 'Tijdregistratie', TIME_ENTRY_FIELDS, options.options);
  } else {
    return generateCsv(columns, rows, TIME_ENTRY_FIELDS, options.options);
  }
}

// Generate empty template for import
export async function generateTemplate(
  entityType: 'CUSTOMERS' | 'INVOICES' | 'EXPENSES' | 'PRODUCTS' | 'TIME_ENTRIES',
  format: 'csv' | 'xlsx'
): Promise<Buffer> {
  const fieldMap: Record<string, Record<string, FieldDefinition>> = {
    CUSTOMERS: CUSTOMER_FIELDS,
    INVOICES: INVOICE_FIELDS,
    EXPENSES: EXPENSE_FIELDS,
    PRODUCTS: PRODUCT_FIELDS,
    TIME_ENTRIES: TIME_ENTRY_FIELDS,
  };

  const columnMap: Record<string, string[]> = {
    CUSTOMERS: CUSTOMER_EXPORT_COLUMNS,
    INVOICES: INVOICE_EXPORT_COLUMNS,
    EXPENSES: EXPENSE_EXPORT_COLUMNS,
    PRODUCTS: PRODUCT_EXPORT_COLUMNS,
    TIME_ENTRIES: TIME_ENTRY_EXPORT_COLUMNS,
  };

  const sheetNames: Record<string, string> = {
    CUSTOMERS: 'Klanten',
    INVOICES: 'Facturen',
    EXPENSES: 'Onkosten',
    PRODUCTS: 'Producten',
    TIME_ENTRIES: 'Tijdregistratie',
  };

  const fields = fieldMap[entityType]!;
  const columns = columnMap[entityType]!;
  const sheetName = sheetNames[entityType]!;

  // Example row to show format
  const exampleRow: Record<string, unknown> = {};
  for (const col of columns) {
    const field = fields[col];
    if (!field) continue;

    let example: unknown = '';
    switch (field.type) {
      case 'email':
        example = 'voorbeeld@email.nl';
        break;
      case 'date':
        example = '01-01-2024';
        break;
      case 'currency':
        example = '100,00';
        break;
      case 'decimal':
        example = '21,00';
        break;
      case 'integer':
        example = '30';
        break;
      case 'boolean':
        example = 'Ja';
        break;
      case 'postalCode':
        example = '1234 AB';
        break;
      case 'phone':
        example = '020-1234567';
        break;
      case 'vatNumber':
        example = 'NL123456789B01';
        break;
      default:
        example = field.required ? '(verplicht)' : '(optioneel)';
    }
    exampleRow[field.label] = example;
  }

  if (format === 'xlsx') {
    return generateExcel(columns, [exampleRow], sheetName, fields, { includeHeader: true });
  } else {
    return generateCsv(columns, [exampleRow], fields, { includeHeader: true });
  }
}
