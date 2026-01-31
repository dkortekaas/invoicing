import { db } from '@/lib/db';
import type { ExpenseCategory } from '@prisma/client';
import { normalizeVendorName } from './vendor-matcher';

interface RecordCorrectionParams {
  userId: string;
  expenseId: string;
  predictedCategory: ExpenseCategory;
  actualCategory: ExpenseCategory;
  supplierName?: string;
  vendorId?: string;
}

/**
 * Record a user correction for learning purposes
 */
export async function recordCorrection(
  params: RecordCorrectionParams
): Promise<void> {
  const {
    userId,
    expenseId,
    predictedCategory,
    actualCategory,
    supplierName,
    vendorId,
  } = params;

  // Don't record if no actual change
  if (predictedCategory === actualCategory) return;

  const normalized = supplierName ? normalizeVendorName(supplierName) : undefined;

  // Create training data record
  await db.expenseTrainingData.create({
    data: {
      userId,
      expenseId,
      supplierName,
      normalizedSupplier: normalized,
      predictedCategory,
      actualCategory,
    },
  });

  // If there's a vendor associated, consider updating its default category
  if (vendorId) {
    await updateVendorCategoryIfNeeded(vendorId, actualCategory);
  }
}

/**
 * Update vendor's default category based on correction patterns
 * Only updates if there's a clear pattern of corrections
 */
async function updateVendorCategoryIfNeeded(
  vendorId: string,
  newCategory: ExpenseCategory
): Promise<void> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) return;

  // Get recent corrections for this vendor's supplier name
  const recentCorrections = await db.expenseTrainingData.findMany({
    where: {
      normalizedSupplier: vendor.normalizedName,
      actualCategory: newCategory,
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    },
    select: { actualCategory: true },
  });

  // If at least 2 corrections to the same category, update the vendor
  if (recentCorrections.length >= 2) {
    await db.vendor.update({
      where: { id: vendorId },
      data: { defaultCategory: newCategory },
    });
  }
}

/**
 * Update a vendor's default category directly
 * Used when user explicitly wants to change the default
 */
export async function updateVendorCategory(
  vendorId: string,
  newCategory: ExpenseCategory
): Promise<void> {
  await db.vendor.update({
    where: { id: vendorId },
    data: { defaultCategory: newCategory },
  });
}

/**
 * Get category correction statistics for a user
 */
export async function getCorrectionStats(userId: string): Promise<{
  totalCorrections: number;
  correctionsByCategory: Record<string, number>;
}> {
  const corrections = await db.expenseTrainingData.findMany({
    where: { userId },
    select: { actualCategory: true },
  });

  const correctionsByCategory: Record<string, number> = {};
  for (const correction of corrections) {
    const cat = correction.actualCategory;
    correctionsByCategory[cat] = (correctionsByCategory[cat] || 0) + 1;
  }

  return {
    totalCorrections: corrections.length,
    correctionsByCategory,
  };
}

/**
 * Get the most likely category for a supplier based on training data
 */
export async function getMostLikelyCategoryForSupplier(
  userId: string,
  supplierName: string
): Promise<ExpenseCategory | null> {
  const normalized = normalizeVendorName(supplierName);
  if (!normalized) return null;

  // Get all corrections for this supplier
  const corrections = await db.expenseTrainingData.findMany({
    where: {
      userId,
      normalizedSupplier: normalized,
    },
    select: { actualCategory: true },
    orderBy: { createdAt: 'desc' },
    take: 10, // Last 10 corrections
  });

  if (corrections.length === 0) return null;

  // Count occurrences of each category
  const categoryCounts: Record<string, number> = {};
  for (const correction of corrections) {
    const cat = correction.actualCategory;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Find the most common category
  let maxCount = 0;
  let mostLikely: ExpenseCategory | null = null;

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostLikely = category as ExpenseCategory;
    }
  }

  return mostLikely;
}
