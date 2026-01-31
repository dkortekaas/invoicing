import type { ExpenseCategory, CategorySource } from '@prisma/client';
import { findMatchingVendor, type VendorMatch } from './vendor-matcher';
import { suggestCategory } from '@/lib/ocr/category-mapper';

export interface ClassificationResult {
  category: ExpenseCategory;
  source: CategorySource;
  confidence: number;
  vendorMatch?: VendorMatch;
  explanation: string;
}

interface ClassifyExpenseParams {
  userId: string;
  supplier?: string;
  description?: string;
  ocrSuggestedCategory?: string;
}

/**
 * Classify an expense using a hybrid pipeline:
 * 1. Vendor match (highest priority)
 * 2. Keyword match from supplier/description
 * 3. OCR suggestion
 * 4. Fallback to OTHER
 */
export async function classifyExpense(
  params: ClassifyExpenseParams
): Promise<ClassificationResult> {
  const { userId, supplier, description, ocrSuggestedCategory } = params;

  // Step 1: Try vendor match
  if (supplier) {
    const vendorMatch = await findMatchingVendor(userId, supplier);
    if (vendorMatch) {
      return {
        category: vendorMatch.vendor.defaultCategory,
        source: 'VENDOR_MATCH',
        confidence: vendorMatch.confidence,
        vendorMatch,
        explanation: getVendorMatchExplanation(vendorMatch),
      };
    }
  }

  // Step 2: Try keyword match
  const keywordCategory = suggestCategory(supplier, description);
  if (keywordCategory) {
    return {
      category: keywordCategory,
      source: 'KEYWORD_MATCH',
      confidence: 0.7, // Medium confidence for keyword matches
      explanation: getKeywordMatchExplanation(supplier, description, keywordCategory),
    };
  }

  // Step 3: Use OCR suggestion if available
  if (ocrSuggestedCategory && isValidExpenseCategory(ocrSuggestedCategory)) {
    return {
      category: ocrSuggestedCategory as ExpenseCategory,
      source: 'AI_PREDICTION',
      confidence: 0.6, // Lower confidence for AI predictions
      explanation: 'Categorie voorgesteld door AI op basis van de factuurinhoud',
    };
  }

  // Step 4: Fallback to OTHER
  return {
    category: 'OTHER',
    source: 'MANUAL',
    confidence: 0,
    explanation: 'Geen automatische categorie gevonden',
  };
}

function getVendorMatchExplanation(match: VendorMatch): string {
  switch (match.matchType) {
    case 'exact':
      return `Bekende leverancier: ${match.vendor.name}`;
    case 'alias':
      return `Leverancier herkend als alias van ${match.vendor.name}`;
    case 'partial':
      return `Mogelijk dezelfde leverancier als ${match.vendor.name}`;
    default:
      return `Leverancier gevonden: ${match.vendor.name}`;
  }
}

function getKeywordMatchExplanation(
  supplier: string | undefined,
  description: string | undefined,
  category: ExpenseCategory
): string {
  const source = supplier || description || 'omschrijving';
  const categoryLabels: Record<ExpenseCategory, string> = {
    OFFICE: 'kantoorkosten',
    TRAVEL: 'reiskosten',
    EQUIPMENT: 'apparatuur',
    SOFTWARE: 'software',
    MARKETING: 'marketing',
    EDUCATION: 'opleiding',
    INSURANCE: 'verzekeringen',
    ACCOUNTANT: 'accountant',
    TELECOM: 'telefoon/internet',
    UTILITIES: 'energie',
    RENT: 'huur',
    MAINTENANCE: 'onderhoud',
    PROFESSIONAL: 'professionele diensten',
    OTHER: 'overig',
  };
  return `Sleutelwoord in "${source}" herkend als ${categoryLabels[category]}`;
}

function isValidExpenseCategory(value: string): value is ExpenseCategory {
  const validCategories: ExpenseCategory[] = [
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
  ];
  return validCategories.includes(value as ExpenseCategory);
}

/**
 * Get Dutch label for category source
 */
export function getCategorySourceLabel(source: CategorySource): string {
  const labels: Record<CategorySource, string> = {
    MANUAL: 'Handmatig',
    VENDOR_MATCH: 'Bekende leverancier',
    KEYWORD_MATCH: 'Sleutelwoord match',
    AI_PREDICTION: 'AI herkenning',
  };
  return labels[source];
}

/**
 * Get category label in Dutch
 */
export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    OFFICE: 'Kantoorkosten',
    TRAVEL: 'Reiskosten',
    EQUIPMENT: 'Apparatuur',
    SOFTWARE: 'Software/Subscriptions',
    MARKETING: 'Marketing',
    EDUCATION: 'Opleiding',
    INSURANCE: 'Verzekeringen',
    ACCOUNTANT: 'Accountant',
    TELECOM: 'Telefoon/Internet',
    UTILITIES: 'Energie',
    RENT: 'Huur',
    MAINTENANCE: 'Onderhoud',
    PROFESSIONAL: 'Professionele diensten',
    OTHER: 'Overig',
  };
  return labels[category];
}
