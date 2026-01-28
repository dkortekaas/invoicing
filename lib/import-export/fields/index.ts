export { CUSTOMER_FIELDS, CUSTOMER_EXPORT_COLUMNS } from './customers';
export { INVOICE_FIELDS, INVOICE_EXPORT_COLUMNS } from './invoices';
export { EXPENSE_FIELDS, EXPENSE_CATEGORY_LABELS, EXPENSE_EXPORT_COLUMNS } from './expenses';
export { PRODUCT_FIELDS, PRODUCT_EXPORT_COLUMNS } from './products';
export { TIME_ENTRY_FIELDS, TIME_ENTRY_EXPORT_COLUMNS } from './time-entries';

import { CUSTOMER_FIELDS, CUSTOMER_EXPORT_COLUMNS } from './customers';
import { INVOICE_FIELDS, INVOICE_EXPORT_COLUMNS } from './invoices';
import { EXPENSE_FIELDS, EXPENSE_EXPORT_COLUMNS } from './expenses';
import { PRODUCT_FIELDS, PRODUCT_EXPORT_COLUMNS } from './products';
import { TIME_ENTRY_FIELDS, TIME_ENTRY_EXPORT_COLUMNS } from './time-entries';
import type { FieldDefinition } from '../types';

export type EntityType = 'CUSTOMERS' | 'INVOICES' | 'EXPENSES' | 'PRODUCTS' | 'TIME_ENTRIES';

export function getFieldsForEntity(entityType: EntityType): Record<string, FieldDefinition> {
  switch (entityType) {
    case 'CUSTOMERS':
      return CUSTOMER_FIELDS;
    case 'INVOICES':
      return INVOICE_FIELDS;
    case 'EXPENSES':
      return EXPENSE_FIELDS;
    case 'PRODUCTS':
      return PRODUCT_FIELDS;
    case 'TIME_ENTRIES':
      return TIME_ENTRY_FIELDS;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

export function getExportColumnsForEntity(entityType: EntityType): string[] {
  switch (entityType) {
    case 'CUSTOMERS':
      return CUSTOMER_EXPORT_COLUMNS;
    case 'INVOICES':
      return INVOICE_EXPORT_COLUMNS;
    case 'EXPENSES':
      return EXPENSE_EXPORT_COLUMNS;
    case 'PRODUCTS':
      return PRODUCT_EXPORT_COLUMNS;
    case 'TIME_ENTRIES':
      return TIME_ENTRY_EXPORT_COLUMNS;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  CUSTOMERS: 'Klanten',
  INVOICES: 'Facturen',
  EXPENSES: 'Onkosten',
  PRODUCTS: 'Producten',
  TIME_ENTRIES: 'Tijdregistratie',
};
