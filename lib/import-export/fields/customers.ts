import type { FieldDefinition } from '../types';

export const CUSTOMER_FIELDS: Record<string, FieldDefinition> = {
  // Verplichte velden
  name: {
    label: 'Bedrijfsnaam',
    required: true,
    type: 'string',
    maxLength: 255,
    aliases: ['bedrijfsnaam', 'company', 'company_name', 'naam', 'klant', 'klantnaam', 'name'],
  },
  email: {
    label: 'Email',
    required: true,
    type: 'email',
    aliases: ['e-mail', 'emailadres', 'mail', 'email'],
  },

  // Adres - verplicht
  address: {
    label: 'Straat + huisnummer',
    required: true,
    type: 'string',
    aliases: ['adres', 'address', 'straatnaam', 'straat', 'straat_huisnummer'],
  },
  city: {
    label: 'Plaats',
    required: true,
    type: 'string',
    aliases: ['plaats', 'woonplaats', 'city', 'stad', 'vestigingsplaats'],
  },
  postalCode: {
    label: 'Postcode',
    required: true,
    type: 'postalCode',
    aliases: ['postcode', 'zip', 'zipcode', 'postal_code', 'pc'],
  },

  // Optionele velden
  companyName: {
    label: 'Bedrijfsnaam (alternatief)',
    required: false,
    type: 'string',
    aliases: ['bedrijf', 'company_name_alt', 'handelsnaam'],
  },
  phone: {
    label: 'Telefoon',
    required: false,
    type: 'phone',
    aliases: ['tel', 'telefoonnummer', 'telefoon', 'phone', 'mobile', 'mobiel'],
  },
  country: {
    label: 'Land',
    required: false,
    type: 'country',
    default: 'Nederland',
    aliases: ['land', 'country'],
  },

  // Zakelijk
  vatNumber: {
    label: 'BTW nummer',
    required: false,
    type: 'vatNumber',
    aliases: ['btw', 'btw_nummer', 'btw-nummer', 'vat', 'vat_number', 'btwnummer'],
  },
  vatCountry: {
    label: 'BTW land',
    required: false,
    type: 'string',
    aliases: ['btw_land', 'vat_country'],
  },
  vatReversed: {
    label: 'BTW verlegd',
    required: false,
    type: 'boolean',
    default: false,
    aliases: ['btw_verlegd', 'verlegd', 'reverse_charge'],
  },

  // Overig
  paymentTermDays: {
    label: 'Betaaltermijn (dagen)',
    required: false,
    type: 'integer',
    default: 30,
    aliases: ['betaaltermijn', 'payment_term', 'betalingstermijn', 'dagen'],
  },
  notes: {
    label: 'Notities',
    required: false,
    type: 'text',
    aliases: ['opmerkingen', 'memo', 'notes', 'notitie', 'opmerking'],
  },
} as const;

// Kolommen voor export (standaard volgorde)
export const CUSTOMER_EXPORT_COLUMNS = [
  'name',
  'email',
  'phone',
  'address',
  'postalCode',
  'city',
  'country',
  'vatNumber',
  'paymentTermDays',
  'notes',
];
