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
  | 'ocr_extraction';

// Subscription tiers in order of capability (higher = more features)
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

// Feature access by tier - all paid tiers have access to all features
const PAID_TIERS: SubscriptionTier[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS'];

const FEATURE_ACCESS: Record<Feature, SubscriptionTier[]> = {
  recurring_invoices: PAID_TIERS,
  vat_reporting: PAID_TIERS,
  time_tracking: PAID_TIERS,
  analytics: PAID_TIERS,
  unlimited_invoices: PAID_TIERS,
  unlimited_emails: PAID_TIERS,
  export: PAID_TIERS,
  tax_reporting: PAID_TIERS,
  ocr_extraction: PAID_TIERS,
};

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

  // Free users: 50 per month
  const FREE_LIMIT = 50;

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
  };
  return names[feature];
}

export function isPremiumFeature(feature: Feature): boolean {
  return !FEATURE_ACCESS[feature].includes('FREE');
}
