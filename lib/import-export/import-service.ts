import { db } from '@/lib/db';
import { getFieldsForEntity, type EntityType } from './fields';
import type { ExpenseCategory } from '@prisma/client';
import type {
  FieldDefinition,
  ImportOptions,
  ValidationDetail,
  ValidationResult,
  ImportResult,
  ParsedFile,
} from './types';

/**
 * Sanitize cell values to prevent CSV formula injection.
 * Cells starting with =, +, -, @, \t, or \r can trigger formula execution
 * in spreadsheet programs when re-exported.
 */
function sanitizeCellValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const dangerous = /^[=+\-@\t\r]/;
  if (dangerous.test(value)) {
    return `'${value}`;
  }
  return value;
}

// ============================================
// FILE PARSING
// ============================================

export async function parseFile(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedFile> {
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return parseExcel(buffer);
  } else {
    return parseCsv(buffer);
  }
}

async function parseExcel(buffer: Buffer): Promise<ParsedFile> {
  const { default: ExcelJSModule } = await import('exceljs');
  const workbook = new ExcelJSModule.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Geen werkblad gevonden');

  const columns: string[] = [];
  const rows: Record<string, unknown>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Header row
      row.eachCell((cell, colNumber) => {
        columns[colNumber - 1] = cell.text?.toString().trim() || `Kolom ${colNumber}`;
      });
    } else {
      // Data row
      const rowData: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const colName = columns[colNumber - 1];
        if (colName) {
          // Handle different cell types
          if (cell.type === ExcelJSModule.ValueType.Date) {
            rowData[colName] = cell.value;
          } else if (cell.type === ExcelJSModule.ValueType.Number) {
            rowData[colName] = cell.value;
          } else {
            rowData[colName] = sanitizeCellValue(cell.text?.toString().trim() || '');
          }
        }
      });
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    }
  });

  return { columns, rows };
}

function parseCsv(buffer: Buffer): ParsedFile {
  // Remove BOM and convert to string
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');

  // Detect line endings
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(lineEnding).filter((line) => line.trim());

  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }

  // Detect delimiter (semicolon for Dutch Excel, comma otherwise)
  const firstLine = lines[0]!;
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Parse header
  const columns = parseCSVLine(firstLine, delimiter);

  // Parse rows
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!, delimiter);
    const rowData: Record<string, unknown> = {};

    columns.forEach((col, index) => {
      rowData[col] = sanitizeCellValue(values[index] || '');
    });

    rows.push(rowData);
  }

  return { columns, rows };
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

// ============================================
// COLUMN DETECTION
// ============================================

export function detectColumnMapping(
  columns: string[],
  entityType: EntityType
): Record<string, string> {
  const fields = getFieldsForEntity(entityType);
  const mapping: Record<string, string> = {};

  for (const col of columns) {
    const normalizedCol = col.toLowerCase().trim();

    // Find match in field aliases
    for (const [fieldName, field] of Object.entries(fields)) {
      const aliases = [
        fieldName.toLowerCase(),
        field.label.toLowerCase(),
        ...(field.aliases || []),
      ];

      if (
        aliases.some(
          (alias) =>
            normalizedCol === alias.toLowerCase() ||
            normalizedCol.includes(alias.toLowerCase())
        )
      ) {
        mapping[col] = fieldName;
        break;
      }
    }

    // Not mapped
    if (!mapping[col]) {
      mapping[col] = '_skip';
    }
  }

  return mapping;
}

// ============================================
// VALIDATION
// ============================================

export function validateAndParseValue(
  rawValue: unknown,
  field: FieldDefinition
): { value: unknown; error?: string; warning?: string } {
  // Null/empty
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    if (field.required) {
      return { value: null, error: `${field.label} is verplicht` };
    }
    return { value: field.default ?? null };
  }

  const strValue = String(rawValue).trim();

  switch (field.type) {
    case 'string':
    case 'text':
      if (field.maxLength && strValue.length > field.maxLength) {
        return {
          value: strValue.substring(0, field.maxLength),
          warning: `Waarde ingekort tot ${field.maxLength} karakters`,
        };
      }
      return { value: strValue };

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strValue)) {
        return { value: strValue, error: 'Ongeldig emailadres' };
      }
      return { value: strValue.toLowerCase() };
    }

    case 'date': {
      const date = parseDate(rawValue);
      if (!date) {
        return { value: null, error: 'Ongeldige datum' };
      }
      return { value: date };
    }

    case 'currency':
    case 'decimal': {
      const num = parseNumber(strValue);
      if (num === null) {
        return { value: null, error: 'Ongeldig bedrag' };
      }
      return { value: num };
    }

    case 'integer': {
      const int = parseInt(strValue, 10);
      if (isNaN(int)) {
        return { value: null, error: 'Ongeldig getal' };
      }
      return { value: int };
    }

    case 'boolean':
      return { value: parseBoolean(strValue) };

    case 'enum':
      // Check direct match
      if (field.enumValues?.includes(strValue.toUpperCase())) {
        return { value: strValue.toUpperCase() };
      }
      // Check mapping (for categories)
      if (field.categoryMapping) {
        const mapped = field.categoryMapping[strValue.toLowerCase()];
        if (mapped) {
          return { value: mapped };
        }
      }
      return {
        value: field.default || null,
        warning: `Onbekende waarde "${strValue}", standaard gebruikt`,
      };

    case 'vatNumber': {
      const vatClean = strValue.replace(/\s/g, '').toUpperCase();
      // Basic NL VAT validation
      if (vatClean.startsWith('NL') && !/^NL\d{9}B\d{2}$/.test(vatClean)) {
        return {
          value: vatClean,
          warning: 'BTW nummer formaat lijkt incorrect',
        };
      }
      return { value: vatClean };
    }

    case 'kvkNumber': {
      const kvkClean = strValue.replace(/\s/g, '');
      if (!/^\d{8}$/.test(kvkClean)) {
        return {
          value: kvkClean,
          warning: 'KvK nummer moet 8 cijfers zijn',
        };
      }
      return { value: kvkClean };
    }

    case 'iban': {
      const ibanClean = strValue.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(ibanClean)) {
        return { value: ibanClean, warning: 'IBAN formaat lijkt incorrect' };
      }
      return { value: ibanClean };
    }

    case 'phone': {
      const phoneClean = strValue.replace(/[\s\-()]/g, '');
      return { value: phoneClean };
    }

    case 'postalCode': {
      const pcClean = strValue.replace(/\s/g, '').toUpperCase();
      // Dutch postal code
      if (/^\d{4}[A-Z]{2}$/.test(pcClean)) {
        return { value: pcClean.substring(0, 4) + ' ' + pcClean.substring(4) };
      }
      return { value: strValue };
    }

    case 'country':
      return { value: strValue || field.default || 'Nederland' };

    default:
      return { value: strValue };
  }
}

function parseDate(value: unknown): Date | null {
  // Already a Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  const strValue = String(value).trim();

  // Try different formats
  const formats = [
    // Dutch format
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    // ISO format
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    // Short year
    /^(\d{1,2})-(\d{1,2})-(\d{2})$/, // DD-MM-YY
  ];

  for (const regex of formats) {
    const match = strValue.match(regex);
    if (match && match.length >= 4) {
      let day: number, month: number, year: number;

      const numbers = match.slice(1).map(Number);
      if (regex.source.startsWith('^(\\d{4})')) {
        // ISO format
        year = numbers[0] ?? 0;
        month = numbers[1] ?? 0;
        day = numbers[2] ?? 0;
      } else {
        day = numbers[0] ?? 0;
        month = numbers[1] ?? 0;
        year = numbers[2] ?? 0;
        if (year < 100) year += 2000;
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try native parse as last resort
  const nativeDate = new Date(strValue);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  return null;
}

function parseNumber(value: string): number | null {
  // Remove currency symbols and spaces
  let clean = value.replace(/[€$£\s]/g, '');

  // Detect decimal separator
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Comma is decimal (Dutch)
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Dot is decimal (English)
    clean = clean.replace(/,/g, '');
  } else if (lastComma !== -1) {
    // Only comma
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: string): boolean {
  const trueValues = ['ja', 'yes', 'true', '1', 'waar', 'x', '✓', '✔', 'y'];
  return trueValues.includes(value.toLowerCase());
}

// ============================================
// VALIDATION RUNNER
// ============================================

export async function validateImport(
  userId: string,
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>,
  entityType: EntityType,
  options: ImportOptions
): Promise<ValidationResult> {
  const fields = getFieldsForEntity(entityType);
  const details: ValidationDetail[] = [];
  const validRows: { rowNum: number; data: Record<string, unknown> }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 for header + 1-indexed
    const row = rows[i]!;
    const mappedRow: Record<string, unknown> = {};
    let hasError = false;

    // Map and validate each column
    for (const [fileCol, systemField] of Object.entries(columnMapping)) {
      if (!systemField || systemField === '_skip') continue;

      const field = fields[systemField];
      if (!field) continue;

      const rawValue = row[fileCol];
      const { value, error, warning } = validateAndParseValue(rawValue, field);

      if (error) {
        details.push({
          row: rowNum,
          field: systemField,
          value: rawValue,
          message: error,
          severity: 'error',
        });
        hasError = true;
      }
      if (warning) {
        details.push({
          row: rowNum,
          field: systemField,
          value: rawValue,
          message: warning,
          severity: 'warning',
        });
      }

      mappedRow[systemField] = value;
    }

    // Check required fields
    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.required && !mappedRow[fieldName]) {
        // Check if field was mapped
        const isMapped = Object.values(columnMapping).includes(fieldName);
        if (isMapped) {
          details.push({
            row: rowNum,
            field: fieldName,
            value: null,
            message: `${field.label} is verplicht`,
            severity: 'error',
          });
          hasError = true;
        }
      }
    }

    if (!hasError) {
      validRows.push({ rowNum, data: mappedRow });
    }
  }

  // Check duplicates
  if (options.duplicateCheckField) {
    const duplicateDetails = await checkDuplicates(
      userId,
      entityType,
      validRows,
      options.duplicateCheckField,
      options.skipDuplicates || false
    );
    details.push(...duplicateDetails);
  }

  return {
    valid: validRows.length - details.filter((d) => d.severity === 'error').length,
    warnings: details.filter((d) => d.severity === 'warning').length,
    errors: details.filter((d) => d.severity === 'error').length,
    details: details.slice(0, 100), // Limit details
    preview: validRows.slice(0, 10).map((r) => r.data),
  };
}

async function checkDuplicates(
  userId: string,
  entityType: EntityType,
  rows: { rowNum: number; data: Record<string, unknown> }[],
  checkField: string,
  skipDuplicates: boolean
): Promise<ValidationDetail[]> {
  const details: ValidationDetail[] = [];

  // Get existing values
  const existingValues = new Set<string>();

  switch (entityType) {
    case 'CUSTOMERS': {
      const customers = await db.customer.findMany({
        where: { userId },
        select: { email: true, name: true },
      });
      if (checkField === 'email') {
        customers.forEach((c) => existingValues.add(c.email.toLowerCase()));
      } else if (checkField === 'name') {
        customers.forEach((c) => existingValues.add(c.name.toLowerCase()));
      }
      break;
    }
    case 'INVOICES': {
      const invoices = await db.invoice.findMany({
        where: { userId },
        select: { invoiceNumber: true },
      });
      invoices.forEach((i) => existingValues.add(i.invoiceNumber.toLowerCase()));
      break;
    }
    case 'PRODUCTS': {
      const products = await db.product.findMany({
        where: { userId },
        select: { name: true },
      });
      products.forEach((p) => existingValues.add(p.name.toLowerCase()));
      break;
    }
  }

  for (const { rowNum, data } of rows) {
    const value = data[checkField];
    if (value && existingValues.has(String(value).toLowerCase())) {
      details.push({
        row: rowNum,
        field: checkField,
        value,
        message: skipDuplicates
          ? 'Duplicaat - wordt overgeslagen'
          : 'Duplicaat gevonden',
        severity: skipDuplicates ? 'warning' : 'error',
      });
    }
  }

  return details;
}

// ============================================
// IMPORT EXECUTION
// ============================================

export async function executeImport(
  userId: string,
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>,
  entityType: EntityType,
  options: ImportOptions
): Promise<ImportResult> {
  const fields = getFieldsForEntity(entityType);
  const details: ImportResult['details'] = [];
  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i]!;

    try {
      // Map row
      const mappedRow: Record<string, unknown> = {};
      let hasError = false;

      for (const [fileCol, systemField] of Object.entries(columnMapping)) {
        if (!systemField || systemField === '_skip') continue;
        const field = fields[systemField];
        if (!field) continue;

        const { value, error } = validateAndParseValue(row[fileCol], field);
        if (error && field.required) {
          hasError = true;
          break;
        }
        mappedRow[systemField] = value;
      }

      if (hasError) {
        details.push({ row: rowNum, status: 'error', message: 'Validatie mislukt' });
        errors++;
        continue;
      }

      // Import based on entity type
      let recordId: string;

      switch (entityType) {
        case 'CUSTOMERS':
          recordId = await importCustomer(userId, mappedRow, options);
          break;
        case 'INVOICES':
          recordId = await importInvoice(userId, mappedRow, options);
          break;
        case 'EXPENSES':
          recordId = await importExpense(userId, mappedRow, options);
          break;
        case 'PRODUCTS':
          recordId = await importProduct(userId, mappedRow, options);
          break;
        case 'TIME_ENTRIES':
          recordId = await importTimeEntry(userId, mappedRow, options);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      details.push({ row: rowNum, status: 'success', recordId });
      success++;
    } catch (error) {
      if (error instanceof SkipError) {
        details.push({ row: rowNum, status: 'skipped', message: error.message });
        skipped++;
      } else {
        details.push({
          row: rowNum,
          status: 'error',
          message: error instanceof Error ? error.message : 'Onbekende fout',
        });
        errors++;
      }
    }
  }

  return { success, skipped, errors, details };
}

class SkipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkipError';
  }
}

// ============================================
// ENTITY IMPORTERS
// ============================================

async function importCustomer(
  userId: string,
  data: Record<string, unknown>,
  options: ImportOptions
): Promise<string> {
  const email = data.email as string;
  const name = data.name as string;

  // Check duplicate
  if (options.skipDuplicates || options.updateExisting) {
    const existing = await db.customer.findFirst({
      where: {
        userId,
        email: email.toLowerCase(),
      },
    });

    if (existing) {
      if (options.skipDuplicates && !options.updateExisting) {
        throw new SkipError('Klant bestaat al');
      }
      if (options.updateExisting) {
        await db.customer.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            companyName: (data.companyName as string) ?? existing.companyName,
            phone: (data.phone as string) ?? existing.phone,
            address: (data.address as string) || existing.address,
            postalCode: (data.postalCode as string) || existing.postalCode,
            city: (data.city as string) || existing.city,
            country: (data.country as string) ?? existing.country,
            vatNumber: (data.vatNumber as string) ?? existing.vatNumber,
            vatCountry: (data.vatCountry as string) ?? existing.vatCountry,
            vatReversed: (data.vatReversed as boolean) ?? existing.vatReversed,
            paymentTermDays: (data.paymentTermDays as number) ?? existing.paymentTermDays,
            notes: (data.notes as string) ?? existing.notes,
          },
        });
        return existing.id;
      }
    }
  }

  // Create new customer
  const customer = await db.customer.create({
    data: {
      userId,
      name,
      email: email.toLowerCase(),
      companyName: data.companyName as string | undefined,
      phone: data.phone as string | undefined,
      address: data.address as string,
      postalCode: data.postalCode as string,
      city: data.city as string,
      country: (data.country as string) || 'Nederland',
      vatNumber: data.vatNumber as string | undefined,
      vatCountry: data.vatCountry as string | undefined,
      vatReversed: (data.vatReversed as boolean) || false,
      paymentTermDays: (data.paymentTermDays as number) || 30,
      notes: data.notes as string | undefined,
    },
  });

  return customer.id;
}

async function importInvoice(
  userId: string,
  data: Record<string, unknown>,
  options: ImportOptions
): Promise<string> {
  const invoiceNumber = data.invoiceNumber as string;

  // Find customer
  let customerId: string | null = null;
  const customerEmail = data.customerEmail as string | undefined;
  const customerName = data.customerName as string | undefined;
  
  if (customerEmail || customerName) {
    const customer = await db.customer.findFirst({
      where: {
        userId,
        OR: [
          customerEmail
            ? { email: customerEmail.toLowerCase() }
            : {},
          customerName
            ? {
                OR: [
                  { name: { contains: customerName, mode: 'insensitive' as const } },
                  { companyName: { contains: customerName, mode: 'insensitive' as const } },
                ],
              }
            : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    });
    customerId = customer?.id || null;
  }

  if (!customerId) {
    const searchInfo = customerEmail 
      ? `email "${customerEmail}"` 
      : customerName 
        ? `naam "${customerName}"`
        : 'geen klantgegevens';
    throw new Error(`Klant niet gevonden (gezocht op: ${searchInfo}). Zorg dat de klant eerst bestaat of importeer eerst de klanten.`);
  }

  // Check duplicate
  if (options.skipDuplicates) {
    const existing = await db.invoice.findFirst({
      where: { userId, invoiceNumber },
    });
    if (existing) {
      throw new SkipError('Factuur bestaat al');
    }
  }

  const invoiceDate = (data.invoiceDate as Date) || new Date();

  const rawTotal = data.total as number | undefined;
  const rawSubtotal = data.subtotal as number | undefined;
  const rawVatAmount = data.vatAmount as number | undefined;

  // Zorg dat alle bedragen altijd ingevuld zijn en voorkom undefined → Prisma fout
  const subtotal =
    rawSubtotal !== undefined
      ? rawSubtotal
      : rawTotal !== undefined && rawVatAmount !== undefined
        ? rawTotal - rawVatAmount
        : rawTotal ?? 0;

  const vatAmount =
    rawVatAmount !== undefined
      ? rawVatAmount
      : rawTotal !== undefined
        ? rawTotal - subtotal
        : 0;

  const total = rawTotal !== undefined ? rawTotal : subtotal + vatAmount;

  const invoice = await db.invoice.create({
    data: {
      userId,
      customerId,
      invoiceNumber,
      invoiceDate,
      dueDate: (data.dueDate as Date) || new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      vatAmount,
      total,
      status: (data.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED') || 'DRAFT',
      paidAt: data.paidAt as Date | undefined,
      reference: data.reference as string | undefined,
      notes: data.notes as string | undefined,
      internalNotes: data.internalNotes as string | undefined,
    },
  });

  return invoice.id;
}

async function importExpense(
  userId: string,
  data: Record<string, unknown>,
  _options: ImportOptions
): Promise<string> {
  // Find project if specified
  let projectId: string | null = null;
  if (data.projectName) {
    const project = await db.project.findFirst({
      where: { userId, name: { contains: data.projectName as string, mode: 'insensitive' as const } },
    });
    projectId = project?.id || null;
  }

  // Find customer if specified
  let customerId: string | null = null;
  if (data.customerName) {
    const customer = await db.customer.findFirst({
      where: { userId, name: { contains: data.customerName as string, mode: 'insensitive' as const } },
    });
    customerId = customer?.id || null;
  }

  const amount = data.amount as number;
  const vatRate = (data.vatRate as number) ?? 21;
  const vatAmount = (data.vatAmount as number) ?? amount - amount / (1 + vatRate / 100);
  const netAmount = (data.netAmount as number) ?? amount - vatAmount;

  const expense = await db.expense.create({
    data: {
      userId,
      date: (data.date as Date) || new Date(),
      description: data.description as string,
      category: ((data.category as string) || 'OTHER') as ExpenseCategory,
      amount,
      vatAmount,
      vatRate,
      netAmount,
      supplier: data.supplier as string | undefined,
      invoiceNumber: data.invoiceNumber as string | undefined,
      projectId,
      customerId,
      deductible: (data.deductible as boolean) ?? true,
      deductiblePerc: (data.deductiblePerc as number) ?? 100,
      notes: data.notes as string | undefined,
    },
  });

  return expense.id;
}

async function importProduct(
  userId: string,
  data: Record<string, unknown>,
  options: ImportOptions
): Promise<string> {
  const name = data.name as string;

  // Check duplicate
  if (options.skipDuplicates || options.updateExisting) {
    const existing = await db.product.findFirst({
      where: { userId, name },
    });

    if (existing) {
      if (options.skipDuplicates && !options.updateExisting) {
        throw new SkipError('Product bestaat al');
      }
      if (options.updateExisting) {
        await db.product.update({
          where: { id: existing.id },
          data: {
            description: (data.description as string) ?? existing.description,
            unitPrice: (data.unitPrice as number) ?? existing.unitPrice,
            vatRate: (data.vatRate as number) ?? existing.vatRate,
            unit: (data.unit as string) ?? existing.unit,
            isActive: (data.isActive as boolean) ?? existing.isActive,
          },
        });
        return existing.id;
      }
    }
  }

  const product = await db.product.create({
    data: {
      userId,
      name,
      description: data.description as string | undefined,
      unitPrice: data.unitPrice as number,
      vatRate: (data.vatRate as number) ?? 21,
      unit: (data.unit as string) || 'uur',
      isActive: (data.isActive as boolean) ?? true,
    },
  });

  return product.id;
}

async function importTimeEntry(
  userId: string,
  data: Record<string, unknown>,
  _options: ImportOptions
): Promise<string> {
  // Find customer if specified
  let customerId: string | null = null;
  if (data.customerName) {
    const customer = await db.customer.findFirst({
      where: { userId, name: { contains: data.customerName as string, mode: 'insensitive' as const } },
    });
    customerId = customer?.id || null;
  }

  // Find project if specified
  let projectId: string | null = null;
  if (data.projectName) {
    const project = await db.project.findFirst({
      where: { userId, name: { contains: data.projectName as string, mode: 'insensitive' as const } },
    });
    projectId = project?.id || null;
  }

  const duration = data.duration as number;
  const hourlyRate = data.hourlyRate as number;
  const amount = (data.amount as number) ?? duration * hourlyRate;

  const startTime = data.startTime as Date;
  const endTime =
    (data.endTime as Date) ??
    new Date(startTime.getTime() + duration * 60 * 60 * 1000);

  const timeEntry = await db.timeEntry.create({
    data: {
      userId,
      description: data.description as string,
      startTime,
      endTime,
      duration,
      hourlyRate,
      amount,
      customerId,
      projectId,
      billable: (data.billable as boolean) ?? true,
      invoiced: (data.invoiced as boolean) ?? false,
      activityType: data.activityType as string | undefined,
      notes: data.notes as string | undefined,
    },
  });

  return timeEntry.id;
}
