import { db } from '@/lib/db';
import type { ExpenseCategory, Vendor } from '@prisma/client';

/**
 * Normalize vendor name for matching
 * - Converts to lowercase
 * - Removes common business suffixes
 * - Trims whitespace
 */
export function normalizeVendorName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common Dutch business suffixes
    .replace(/\s*(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|c\.?v\.?|stichting|holding|groep|group|nederland|netherlands|nl)\s*$/gi, '')
    // Remove common international suffixes
    .replace(/\s*(inc\.?|ltd\.?|llc\.?|corp\.?|gmbh|ag|sa|srl|s\.?l\.?)\s*$/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export interface VendorMatch {
  vendor: Vendor;
  matchType: 'exact' | 'alias' | 'partial';
  confidence: number;
}

/**
 * Find a matching vendor for a given supplier name
 * Searches both user-specific and global vendors
 */
export async function findMatchingVendor(
  userId: string,
  supplierName: string
): Promise<VendorMatch | null> {
  if (!supplierName) return null;

  const normalized = normalizeVendorName(supplierName);
  if (!normalized) return null;

  // Search user-specific vendors first, then global vendors
  const vendors = await db.vendor.findMany({
    where: {
      OR: [
        { userId: userId },
        { userId: null }, // Global vendors
      ],
    },
    orderBy: [
      { userId: 'desc' }, // User vendors first (non-null comes before null in desc)
      { useCount: 'desc' }, // Most used first
    ],
  });

  // Try exact normalized name match first
  for (const vendor of vendors) {
    if (vendor.normalizedName === normalized) {
      return {
        vendor,
        matchType: 'exact',
        confidence: 1.0,
      };
    }
  }

  // Try alias match
  for (const vendor of vendors) {
    const normalizedAliases = vendor.aliases.map(a => normalizeVendorName(a));
    if (normalizedAliases.includes(normalized)) {
      return {
        vendor,
        matchType: 'alias',
        confidence: 0.95,
      };
    }
  }

  // Try partial match (vendor name contains supplier or vice versa)
  for (const vendor of vendors) {
    if (
      vendor.normalizedName.includes(normalized) ||
      normalized.includes(vendor.normalizedName)
    ) {
      // Calculate confidence based on match quality
      const longerLength = Math.max(vendor.normalizedName.length, normalized.length);
      const shorterLength = Math.min(vendor.normalizedName.length, normalized.length);
      const confidence = shorterLength / longerLength;

      if (confidence >= 0.6) {
        return {
          vendor,
          matchType: 'partial',
          confidence,
        };
      }
    }
  }

  return null;
}

/**
 * Create a new vendor from an expense
 */
export async function createVendorFromExpense(
  userId: string,
  name: string,
  category: ExpenseCategory
): Promise<Vendor> {
  const normalized = normalizeVendorName(name);

  return db.vendor.create({
    data: {
      userId,
      name: name.trim(),
      normalizedName: normalized,
      aliases: [],
      defaultCategory: category,
      useCount: 1,
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Update vendor usage statistics
 */
export async function updateVendorUsage(vendorId: string): Promise<void> {
  await db.vendor.update({
    where: { id: vendorId },
    data: {
      useCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Search vendors for autocomplete
 */
export async function searchVendors(
  userId: string,
  query: string,
  limit: number = 10
): Promise<Vendor[]> {
  if (!query || query.length < 2) return [];

  const normalized = normalizeVendorName(query);

  return db.vendor.findMany({
    where: {
      OR: [
        { userId: userId },
        { userId: null },
      ],
      AND: {
        OR: [
          { normalizedName: { contains: normalized } },
          { name: { contains: query, mode: 'insensitive' } },
          { aliases: { has: query } },
        ],
      },
    },
    orderBy: [
      { userId: 'desc' },
      { useCount: 'desc' },
    ],
    take: limit,
  });
}
