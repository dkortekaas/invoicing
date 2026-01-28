import type { FieldDefinition } from '../types';

export const PRODUCT_FIELDS: Record<string, FieldDefinition> = {
  // Verplichte velden
  name: {
    label: 'Naam',
    required: true,
    type: 'string',
    maxLength: 255,
    aliases: ['naam', 'name', 'product', 'productnaam', 'artikel', 'dienst'],
  },
  unitPrice: {
    label: 'Prijs',
    required: true,
    type: 'currency',
    aliases: ['prijs', 'price', 'unit_price', 'stukprijs', 'tarief', 'bedrag'],
  },

  // Optionele velden
  description: {
    label: 'Omschrijving',
    required: false,
    type: 'text',
    aliases: ['omschrijving', 'description', 'beschrijving', 'toelichting'],
  },
  vatRate: {
    label: 'BTW tarief (%)',
    required: false,
    type: 'decimal',
    default: 21,
    aliases: ['btw', 'btw_tarief', 'btw_%', 'vat_rate', 'btw_percentage'],
  },
  unit: {
    label: 'Eenheid',
    required: false,
    type: 'string',
    default: 'uur',
    aliases: ['eenheid', 'unit', 'per'],
  },
  isActive: {
    label: 'Actief',
    required: false,
    type: 'boolean',
    default: true,
    aliases: ['actief', 'active', 'is_active', 'beschikbaar'],
  },
} as const;

// Kolommen voor export (standaard volgorde)
export const PRODUCT_EXPORT_COLUMNS = [
  'name',
  'description',
  'unitPrice',
  'vatRate',
  'unit',
  'isActive',
];
