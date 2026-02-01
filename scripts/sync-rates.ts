import 'dotenv/config';
import { syncECBRates } from '../lib/currency/ecb-sync';

async function main() {
  console.log('Syncing ECB exchange rates...');
  try {
    const result = await syncECBRates();
    console.log(`Success! Synced ${result.synced} rates for date: ${result.date.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('Error syncing rates:', error);
    process.exit(1);
  }
}

main();
