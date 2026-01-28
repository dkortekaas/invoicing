import type { FieldDefinition } from '../types';

export const TIME_ENTRY_FIELDS: Record<string, FieldDefinition> = {
  // Verplichte velden
  description: {
    label: 'Omschrijving',
    required: true,
    type: 'string',
    aliases: ['omschrijving', 'description', 'taak', 'activiteit', 'werkzaamheden'],
  },
  startTime: {
    label: 'Starttijd',
    required: true,
    type: 'date',
    aliases: ['start', 'starttijd', 'start_time', 'begintijd', 'datum', 'date'],
  },
  duration: {
    label: 'Duur (uren)',
    required: true,
    type: 'decimal',
    aliases: ['duur', 'duration', 'uren', 'hours', 'tijd', 'gewerkte_uren'],
  },
  hourlyRate: {
    label: 'Uurtarief',
    required: true,
    type: 'currency',
    aliases: ['uurtarief', 'tarief', 'hourly_rate', 'rate', 'prijs_per_uur'],
  },

  // Optionele velden
  endTime: {
    label: 'Eindtijd',
    required: false,
    type: 'date',
    aliases: ['eind', 'eindtijd', 'end_time', 'tot'],
  },

  // Klant/project koppeling
  customerName: {
    label: 'Klant',
    required: false,
    type: 'string',
    lookupField: 'customer',
    aliases: ['klant', 'customer', 'klantnaam', 'opdrachtgever'],
  },
  projectName: {
    label: 'Project',
    required: false,
    type: 'string',
    lookupField: 'project',
    aliases: ['project', 'project_naam', 'projectnaam'],
  },

  // Billing
  billable: {
    label: 'Factureerbaar',
    required: false,
    type: 'boolean',
    default: true,
    aliases: ['factureerbaar', 'billable', 'declarabel', 'te_factureren'],
  },
  invoiced: {
    label: 'Gefactureerd',
    required: false,
    type: 'boolean',
    default: false,
    aliases: ['gefactureerd', 'invoiced', 'op_factuur'],
  },

  // Berekend veld
  amount: {
    label: 'Bedrag',
    required: false,
    type: 'currency',
    aliases: ['bedrag', 'amount', 'totaal', 'total'],
  },

  // Metadata
  activityType: {
    label: 'Activiteit type',
    required: false,
    type: 'string',
    aliases: ['type', 'activiteit_type', 'activity_type', 'soort'],
  },
  notes: {
    label: 'Notities',
    required: false,
    type: 'text',
    aliases: ['notities', 'opmerkingen', 'notes', 'memo'],
  },
} as const;

// Kolommen voor export (standaard volgorde)
export const TIME_ENTRY_EXPORT_COLUMNS = [
  'startTime',
  'endTime',
  'duration',
  'description',
  'customerName',
  'projectName',
  'hourlyRate',
  'amount',
  'billable',
  'invoiced',
  'activityType',
  'notes',
];
