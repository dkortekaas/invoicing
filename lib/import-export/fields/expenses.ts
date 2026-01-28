import type { FieldDefinition } from '../types';

export const EXPENSE_FIELDS: Record<string, FieldDefinition> = {
  // Basis
  date: {
    label: 'Datum',
    required: true,
    type: 'date',
    aliases: ['datum', 'date', 'boekdatum', 'factuurdatum', 'kostendatum'],
  },
  description: {
    label: 'Omschrijving',
    required: true,
    type: 'string',
    aliases: ['omschrijving', 'description', 'memo', 'naam', 'wat'],
  },

  // Bedragen
  amount: {
    label: 'Bedrag (incl. BTW)',
    required: true,
    type: 'currency',
    aliases: ['bedrag', 'totaal', 'amount', 'total', 'incl_btw', 'bruto'],
  },
  netAmount: {
    label: 'Bedrag (excl. BTW)',
    required: false,
    type: 'currency',
    aliases: ['netto', 'excl_btw', 'net_amount', 'exclusief_btw'],
  },
  vatAmount: {
    label: 'BTW bedrag',
    required: false,
    type: 'currency',
    aliases: ['btw_bedrag', 'btw', 'vat', 'vat_amount'],
  },
  vatRate: {
    label: 'BTW tarief (%)',
    required: false,
    type: 'decimal',
    aliases: ['btw_tarief', 'btw_%', 'vat_rate', 'btw_percentage'],
  },

  // Categorisatie
  category: {
    label: 'Categorie',
    required: true,
    type: 'enum',
    enumValues: [
      'OFFICE',
      'TRAVEL',
      'EQUIPMENT',
      'SOFTWARE',
      'MARKETING',
      'EDUCATION',
      'INSURANCE',
      'ACCOUNTANT',
      'TELECOM',
      'UTILITIES',
      'RENT',
      'MAINTENANCE',
      'PROFESSIONAL',
      'OTHER',
    ],
    categoryMapping: {
      // Nederlands → enum
      'kantoor': 'OFFICE',
      'kantoorkosten': 'OFFICE',
      'kantoorartikelen': 'OFFICE',
      'office': 'OFFICE',
      'reis': 'TRAVEL',
      'reiskosten': 'TRAVEL',
      'travel': 'TRAVEL',
      'vervoer': 'TRAVEL',
      'brandstof': 'TRAVEL',
      'benzine': 'TRAVEL',
      'diesel': 'TRAVEL',
      'ov': 'TRAVEL',
      'openbaar vervoer': 'TRAVEL',
      'trein': 'TRAVEL',
      'parkeren': 'TRAVEL',
      'taxi': 'TRAVEL',
      'apparatuur': 'EQUIPMENT',
      'equipment': 'EQUIPMENT',
      'hardware': 'EQUIPMENT',
      'computer': 'EQUIPMENT',
      'laptop': 'EQUIPMENT',
      'telefoon': 'EQUIPMENT',
      'software': 'SOFTWARE',
      'subscriptions': 'SOFTWARE',
      'abonnement': 'SOFTWARE',
      'abonnementen': 'SOFTWARE',
      'licentie': 'SOFTWARE',
      'marketing': 'MARKETING',
      'reclame': 'MARKETING',
      'advertentie': 'MARKETING',
      'opleiding': 'EDUCATION',
      'education': 'EDUCATION',
      'training': 'EDUCATION',
      'cursus': 'EDUCATION',
      'boeken': 'EDUCATION',
      'verzekering': 'INSURANCE',
      'insurance': 'INSURANCE',
      'verzekeringen': 'INSURANCE',
      'accountant': 'ACCOUNTANT',
      'boekhouder': 'ACCOUNTANT',
      'administratie': 'ACCOUNTANT',
      'telecom': 'TELECOM',
      'telefonie': 'TELECOM',
      'internet': 'TELECOM',
      'mobiel': 'TELECOM',
      'energie': 'UTILITIES',
      'utilities': 'UTILITIES',
      'gas': 'UTILITIES',
      'water': 'UTILITIES',
      'elektriciteit': 'UTILITIES',
      'stroom': 'UTILITIES',
      'huur': 'RENT',
      'rent': 'RENT',
      'kantoorhuur': 'RENT',
      'onderhoud': 'MAINTENANCE',
      'maintenance': 'MAINTENANCE',
      'reparatie': 'MAINTENANCE',
      'professioneel': 'PROFESSIONAL',
      'professional': 'PROFESSIONAL',
      'diensten': 'PROFESSIONAL',
      'advies': 'PROFESSIONAL',
      'overig': 'OTHER',
      'other': 'OTHER',
      'anders': 'OTHER',
    },
    aliases: ['categorie', 'category', 'kostensoort', 'type', 'soort'],
  },

  // Leverancier
  supplier: {
    label: 'Leverancier',
    required: false,
    type: 'string',
    aliases: ['leverancier', 'vendor', 'supplier', 'bedrijf', 'winkel', 'van'],
  },
  invoiceNumber: {
    label: 'Factuurnummer',
    required: false,
    type: 'string',
    aliases: ['factuurnummer', 'factuurnr', 'bonnummer', 'bon_nummer', 'invoice_number'],
  },

  // Project koppeling
  projectName: {
    label: 'Project',
    required: false,
    type: 'string',
    lookupField: 'project',
    aliases: ['project', 'project_naam', 'projectnaam'],
  },

  // Klant koppeling (voor doorbelasten)
  customerName: {
    label: 'Klant (doorbelasten)',
    required: false,
    type: 'string',
    lookupField: 'customer',
    aliases: ['klant', 'customer', 'doorbelasten_aan'],
  },

  // Flags
  deductible: {
    label: 'Aftrekbaar',
    required: false,
    type: 'boolean',
    default: true,
    aliases: ['aftrekbaar', 'deductible', 'btw_aftrekbaar'],
  },
  deductiblePerc: {
    label: 'Aftrekbaar percentage',
    required: false,
    type: 'decimal',
    default: 100,
    aliases: ['aftrekbaar_percentage', 'deductible_perc', 'aftrek_%'],
  },

  // Notities
  notes: {
    label: 'Notities',
    required: false,
    type: 'text',
    aliases: ['notities', 'opmerkingen', 'notes', 'memo'],
  },
} as const;

// Categorie vertalingen voor export (enum → Nederlands)
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  OFFICE: 'Kantoorkosten',
  TRAVEL: 'Reiskosten',
  EQUIPMENT: 'Apparatuur',
  SOFTWARE: 'Software',
  MARKETING: 'Marketing',
  EDUCATION: 'Opleiding',
  INSURANCE: 'Verzekeringen',
  ACCOUNTANT: 'Accountant',
  TELECOM: 'Telefoon/internet',
  UTILITIES: 'Energie',
  RENT: 'Huur',
  MAINTENANCE: 'Onderhoud',
  PROFESSIONAL: 'Professionele diensten',
  OTHER: 'Overig',
};

// Kolommen voor export (standaard volgorde)
export const EXPENSE_EXPORT_COLUMNS = [
  'date',
  'description',
  'category',
  'supplier',
  'amount',
  'vatAmount',
  'vatRate',
  'netAmount',
  'invoiceNumber',
  'deductible',
  'notes',
];
