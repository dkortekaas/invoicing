import { PrismaClient } from '@prisma/client';
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
