import type { FieldDefinition } from '../types';

export const INVOICE_FIELDS: Record<string, FieldDefinition> = {
  // Identificatie
  invoiceNumber: {
    label: 'Factuurnummer',
    required: true,
    type: 'string',
    aliases: ['factuurnr', 'invoice_number', 'nummer', 'factuurnummer', 'factuur_nummer'],
  },

  // Klant (kan via email, naam)
  customerEmail: {
    label: 'Klant email',
    required: false,
    type: 'email',
    aliases: ['klant_email', 'customer_email', 'debiteur_email'],
    lookupField: 'customer',
  },
  customerName: {
    label: 'Klantnaam',
    required: false,
    type: 'string',
    aliases: ['klant', 'bedrijfsnaam', 'klant_naam', 'customer_name', 'debiteur'],
    lookupField: 'customer',
  },

  // Datums
  invoiceDate: {
    label: 'Factuurdatum',
    required: true,
    type: 'date',
    aliases: ['datum', 'date', 'factuurdatum', 'factuur_datum'],
  },
  dueDate: {
    label: 'Vervaldatum',
    required: false,
    type: 'date',
    aliases: ['vervaldatum', 'due_date', 'betaaldatum', 'verval_datum', 'uiterste_betaaldatum'],
  },

  // Bedragen
  subtotal: {
    label: 'Subtotaal (excl. BTW)',
    required: false,
    type: 'currency',
    aliases: ['subtotaal', 'netto', 'excl_btw', 'exclusief_btw', 'bedrag_excl'],
  },
  vatAmount: {
    label: 'BTW bedrag',
    required: false,
    type: 'currency',
    aliases: ['btw_bedrag', 'btw', 'vat_amount', 'btw_totaal'],
  },
  total: {
    label: 'Totaal (incl. BTW)',
    required: true,
    type: 'currency',
    aliases: ['totaal', 'bruto', 'incl_btw', 'total', 'inclusief_btw', 'bedrag_incl', 'bedrag'],
  },

  // Status
  status: {
    label: 'Status',
    required: false,
    type: 'enum',
    enumValues: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'DRAFT',
    aliases: ['status'],
    categoryMapping: {
      'concept': 'DRAFT',
      'draft': 'DRAFT',
      'verzonden': 'SENT',
      'sent': 'SENT',
      'verstuurd': 'SENT',
      'betaald': 'PAID',
      'paid': 'PAID',
      'voldaan': 'PAID',
      'achterstallig': 'OVERDUE',
      'overdue': 'OVERDUE',
      'verlopen': 'OVERDUE',
      'geannuleerd': 'CANCELLED',
      'cancelled': 'CANCELLED',
      'canceled': 'CANCELLED',
    },
  },
  paidAt: {
    label: 'Betaaldatum',
    required: false,
    type: 'date',
    aliases: ['betaald_op', 'paid_date', 'betaling_datum', 'datum_betaald'],
  },

  // Regel items (voor gedetailleerde import)
  lineDescription: {
    label: 'Regel omschrijving',
    required: false,
    type: 'string',
    isLineItem: true,
    aliases: ['omschrijving', 'description', 'product', 'artikel', 'dienst'],
  },
  lineQuantity: {
    label: 'Aantal',
    required: false,
    type: 'decimal',
    isLineItem: true,
    aliases: ['aantal', 'quantity', 'qty', 'hoeveelheid'],
  },
  lineUnitPrice: {
    label: 'Prijs per stuk',
    required: false,
    type: 'currency',
    isLineItem: true,
    aliases: ['prijs', 'stukprijs', 'unit_price', 'eenheidsprijs', 'tarief'],
  },
  lineVatRate: {
    label: 'BTW tarief (%)',
    required: false,
    type: 'decimal',
    isLineItem: true,
    aliases: ['btw_tarief', 'btw_%', 'vat_rate', 'btw_percentage'],
  },
  lineUnit: {
    label: 'Eenheid',
    required: false,
    type: 'string',
    isLineItem: true,
    default: 'uur',
    aliases: ['eenheid', 'unit'],
  },
  lineTotal: {
    label: 'Regeltotaal',
    required: false,
    type: 'currency',
    isLineItem: true,
    aliases: ['regel_totaal', 'line_total', 'bedrag'],
  },

  // Referenties
  reference: {
    label: 'Referentie',
    required: false,
    type: 'string',
    aliases: ['referentie', 'kenmerk', 'reference', 'uw_kenmerk', 'po_nummer'],
  },
  notes: {
    label: 'Notities',
    required: false,
    type: 'text',
    aliases: ['opmerkingen', 'notes', 'notitie'],
  },
  internalNotes: {
    label: 'Interne notities',
    required: false,
    type: 'text',
    aliases: ['interne_notities', 'internal_notes', 'memo'],
  },
} as const;

// Kolommen voor export (standaard volgorde)
export const INVOICE_EXPORT_COLUMNS = [
  'invoiceNumber',
  'customerName',
  'customerEmail',
  'invoiceDate',
  'dueDate',
  'subtotal',
  'vatAmount',
  'total',
  'status',
  'paidAt',
  'reference',
  'notes',
];
