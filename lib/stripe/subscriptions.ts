import { db } from '@/lib/db';

export type Feature =
  | 'recurring_invoices'
  | 'vat_reporting'
  | 'time_tracking'
  | 'analytics'
  | 'unlimited_invoices'
  | 'unlimited_emails'
  | 'export'
  | 'tax_reporting'
  | 'ocr_extraction'
  | 'credit_notes'
  | 'customer_portal'
  | 'multi_currency'
  | 'api_access'
  | 'multi_user'
  | 'bulk_invoicing';

// Subscription tiers in order of capability (higher = more features)
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

const PAID_TIERS: SubscriptionTier[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS'];

// Granular feature access by tier
const FEATURE_ACCESS: Record<Feature, SubscriptionTier[]> = {
  recurring_invoices: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  vat_reporting: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  time_tracking: ['PROFESSIONAL', 'BUSINESS'],
  analytics: ['PROFESSIONAL', 'BUSINESS'],
  unlimited_invoices: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  unlimited_emails: ['PROFESSIONAL', 'BUSINESS'],
  export: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  tax_reporting: ['PROFESSIONAL', 'BUSINESS'],
  ocr_extraction: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  credit_notes: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  customer_portal: ['BUSINESS'],
  multi_currency: ['BUSINESS'],
  api_access: ['BUSINESS'],
  multi_user: ['BUSINESS'],
  bulk_invoicing: ['PROFESSIONAL', 'BUSINESS'],
};

// Minimum tier required for each feature (for UI messaging)
const MINIMUM_TIER: Record<Feature, SubscriptionTier> = {
  recurring_invoices: 'STARTER',
  vat_reporting: 'STARTER',
  time_tracking: 'PROFESSIONAL',
  analytics: 'PROFESSIONAL',
  unlimited_invoices: 'STARTER',
  unlimited_emails: 'PROFESSIONAL',
  export: 'STARTER',
  tax_reporting: 'PROFESSIONAL',
  ocr_extraction: 'STARTER',
  credit_notes: 'STARTER',
  customer_portal: 'BUSINESS',
  multi_currency: 'BUSINESS',
  api_access: 'BUSINESS',
  multi_user: 'BUSINESS',
  bulk_invoicing: 'PROFESSIONAL',
};

export function getMinimumTier(feature: Feature): SubscriptionTier {
  return MINIMUM_TIER[feature];
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    FREE: 'Gratis',
    STARTER: 'Starter',
    PROFESSIONAL: 'Professional',
    BUSINESS: 'Business',
  };
  return names[tier];
}

/**
 * Check if user has an active paid subscription (either Stripe or manual)
 */
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      isManualSubscription: true,
      manualSubscriptionExpiresAt: true,
    },
  });

  if (!user) return false;

  // Check if user has a paid tier
  if (!PAID_TIERS.includes(user.subscriptionTier as SubscriptionTier)) {
    return false;
  }

  // Manual subscription check
  if (user.isManualSubscription) {
    // If no expiration date, subscription is unlimited
    if (!user.manualSubscriptionExpiresAt) return true;
    // Check if not expired
    return new Date(user.manualSubscriptionExpiresAt) > new Date();
  }

  // Stripe subscription check
  const isActive = ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus);
  const notExpired = user.stripeCurrentPeriodEnd
    ? new Date(user.stripeCurrentPeriodEnd) > new Date()
    : false;

  return isActive && notExpired;
}

export async function hasFeatureAccess(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionTier: true,
    },
  });

  if (!user) return false;

  // Superusers have access to everything
  if (user.role === 'SUPERUSER') {
    return true;
  }

  // Check if feature is available on free tier
  if (FEATURE_ACCESS[feature].includes('FREE' as SubscriptionTier)) {
    return true;
  }

  // Check if user has active paid subscription
  const isActive = await hasActiveSubscription(userId);
  if (isActive) {
    return FEATURE_ACCESS[feature].includes(user.subscriptionTier as SubscriptionTier);
  }

  return false;
}

export async function canCreateInvoice(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionTier: true,
      invoiceCount: true,
      invoiceCountResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Superusers have unlimited access
  if (user.role === 'SUPERUSER') {
    return { allowed: true };
  }

  // Check if user has active paid subscription (includes manual subscriptions)
  const isActive = await hasActiveSubscription(userId);
  if (isActive && PAID_TIERS.includes(user.subscriptionTier as SubscriptionTier)) {
    return { allowed: true };
  }

  // Free users: 5 per month
  const FREE_LIMIT = 5;

  // Check if we need to reset counter (monthly)
  const now = new Date();
  const resetDate = new Date(user.invoiceCountResetAt);
  const daysSinceReset = Math.floor(
    (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReset >= 30) {
    // Reset counter
    await db.user.update({
      where: { id: userId },
      data: {
        invoiceCount: 0,
        invoiceCountResetAt: now,
      },
    });

    return {
      allowed: true,
      current: 0,
      limit: FREE_LIMIT,
    };
  }

  // Check limit
  if (user.invoiceCount >= FREE_LIMIT) {
    return {
      allowed: false,
      reason: 'Monthly invoice limit reached',
      current: user.invoiceCount,
      limit: FREE_LIMIT,
    };
  }

  return {
    allowed: true,
    current: user.invoiceCount,
    limit: FREE_LIMIT,
  };
}

export async function canCreateExpense(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionTier: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Superusers and paid users have unlimited access
  if (user.role === 'SUPERUSER') {
    return { allowed: true };
  }

  const isActive = await hasActiveSubscription(userId);
  if (isActive && PAID_TIERS.includes(user.subscriptionTier as SubscriptionTier)) {
    return { allowed: true };
  }

  // Free users: 10 per month
  const FREE_LIMIT = 10;

  // Count expenses created this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const expenseCount = await db.expense.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (expenseCount >= FREE_LIMIT) {
    return {
      allowed: false,
      reason: 'Monthly expense limit reached',
      current: expenseCount,
      limit: FREE_LIMIT,
    };
  }

  return {
    allowed: true,
    current: expenseCount,
    limit: FREE_LIMIT,
  };
}

export async function incrementInvoiceCount(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      invoiceCount: { increment: 1 },
    },
  });
}

export function getFeatureName(feature: Feature): string {
  const names: Record<Feature, string> = {
    recurring_invoices: 'Terugkerende Facturen',
    vat_reporting: 'BTW Rapportage',
    time_tracking: 'Tijdregistratie',
    analytics: 'Analytics Dashboard',
    unlimited_invoices: 'Onbeperkt Facturen',
    unlimited_emails: 'Onbeperkt Emails',
    export: 'Export Functionaliteit',
    tax_reporting: 'Inkomstenbelasting Overzicht',
    ocr_extraction: 'OCR Bonnetjes Herkenning',
    credit_notes: 'Credit Nota\'s',
    customer_portal: 'Klantportaal',
    multi_currency: 'Multi-valuta',
    api_access: 'API Toegang',
    multi_user: 'Multi-gebruiker',
    bulk_invoicing: 'Bulk Facturatie',
  };
  return names[feature];
}

export function isPremiumFeature(feature: Feature): boolean {
  return !FEATURE_ACCESS[feature].includes('FREE');
}
