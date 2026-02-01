import { PrismaClient, SymbolPosition } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Use the same connection pattern as the app
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Normalize DATABASE_URL to explicitly set sslmode=verify-full to avoid warnings
try {
  const url = new URL(connectionString);
  const params = new URLSearchParams(url.search);

  // If sslmode is not explicitly set, add verify-full to maintain current secure behavior
  if (!params.has('sslmode')) {
    params.set('sslmode', 'verify-full');
    url.search = params.toString();
    connectionString = url.toString();
  }
} catch (error) {
  // If URL parsing fails, use original connection string
  console.warn('Could not parse DATABASE_URL for SSL mode normalization:', error);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Supported currencies for multi-currency invoicing
const currencies = [
  { code: 'EUR', name: 'Euro', nameDutch: 'Euro', symbol: '€', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 2, isDefault: true, sortOrder: 0 },
  { code: 'USD', name: 'US Dollar', nameDutch: 'Amerikaanse Dollar', symbol: '$', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 1 },
  { code: 'GBP', name: 'British Pound', nameDutch: 'Brits Pond', symbol: '£', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 2 },
  { code: 'CHF', name: 'Swiss Franc', nameDutch: 'Zwitserse Frank', symbol: 'CHF', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 3 },
  { code: 'SEK', name: 'Swedish Krona', nameDutch: 'Zweedse Kroon', symbol: 'kr', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 4 },
  { code: 'NOK', name: 'Norwegian Krone', nameDutch: 'Noorse Kroon', symbol: 'kr', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 5 },
  { code: 'DKK', name: 'Danish Krone', nameDutch: 'Deense Kroon', symbol: 'kr', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 6 },
  { code: 'PLN', name: 'Polish Zloty', nameDutch: 'Poolse Zloty', symbol: 'zł', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 7 },
  { code: 'CZK', name: 'Czech Koruna', nameDutch: 'Tsjechische Kroon', symbol: 'Kč', symbolPosition: 'AFTER' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 8 },
  { code: 'CAD', name: 'Canadian Dollar', nameDutch: 'Canadese Dollar', symbol: 'C$', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 9 },
  { code: 'AUD', name: 'Australian Dollar', nameDutch: 'Australische Dollar', symbol: 'A$', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 2, isDefault: false, sortOrder: 10 },
  { code: 'JPY', name: 'Japanese Yen', nameDutch: 'Japanse Yen', symbol: '¥', symbolPosition: 'BEFORE' as SymbolPosition, decimalPlaces: 0, isDefault: false, sortOrder: 11 },
];

async function main() {
  // Create default system settings
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      watermarkEnabled: true,
      watermarkText: 'GRATIS VERSIE - Upgrade naar Pro',
      watermarkOpacity: 0.15,
      watermarkRotation: -45,
      watermarkFontSize: 40,
      watermarkColor: '#999999',
      watermarkPosition: 'DIAGONAL',
      freeUserWatermarkEnabled: true,
    },
  });

  console.log('Seeded system settings');

  // Seed currencies
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        name: currency.name,
        nameDutch: currency.nameDutch,
        symbol: currency.symbol,
        symbolPosition: currency.symbolPosition,
        decimalPlaces: currency.decimalPlaces,
        isDefault: currency.isDefault,
        sortOrder: currency.sortOrder,
        isActive: true,
      },
      create: {
        code: currency.code,
        name: currency.name,
        nameDutch: currency.nameDutch,
        symbol: currency.symbol,
        symbolPosition: currency.symbolPosition,
        decimalPlaces: currency.decimalPlaces,
        isDefault: currency.isDefault,
        sortOrder: currency.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${currencies.length} currencies`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
