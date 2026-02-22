import { db } from '@/lib/db';

export type Feature =
  | 'recurring_invoices'
  | 'vat_reporting'
  | 'time_tracking'
  | 'analytics'
  | 'unlimited_invoices'
  | 'unlimited_emails'
  | 'export'
  | 'import'
  | 'tax_reporting'
  | 'ocr_extraction'
  | 'credit_notes'
  | 'customer_portal'
  | 'multi_currency'
  | 'api_access'
  | 'multi_user'
  | 'bulk_invoicing'
  | 'expenses'
  | 'payment_links'
  | 'smart_reminders'
  | 'accounting_integrations'
  | 'cashflow_forecasts';

// Subscription tiers in order of capability (higher = more features)
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

const PAID_TIERS: SubscriptionTier[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS'];

// Granular feature access by tier
// FREE: Tot 5 facturen/maand, klantenbeheer, productencatalogus, PDF generatie
// STARTER: + Onbeperkt facturen, OCR bonnetjes, onkosten bijhouden, BTW-overzichten
// PROFESSIONAL: + iDEAL betaallinks, projecten & urenregistratie, slimme herinneringen, boekhoudkoppelingen, analytics
// BUSINESS: + Multi-valuta, klantportaal, cashflow voorspellingen, API toegang
const FEATURE_ACCESS: Record<Feature, SubscriptionTier[]> = {
  // Starter features
  recurring_invoices: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  vat_reporting: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  unlimited_invoices: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  ocr_extraction: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  expenses: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  credit_notes: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  export: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  import: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  // Professional features
  time_tracking: ['PROFESSIONAL', 'BUSINESS'],
  analytics: ['PROFESSIONAL', 'BUSINESS'],
  payment_links: ['PROFESSIONAL', 'BUSINESS'],
  smart_reminders: ['PROFESSIONAL', 'BUSINESS'],
  accounting_integrations: ['PROFESSIONAL', 'BUSINESS'],
  unlimited_emails: ['PROFESSIONAL', 'BUSINESS'],
  tax_reporting: ['PROFESSIONAL', 'BUSINESS'],
  bulk_invoicing: ['PROFESSIONAL', 'BUSINESS'],
  // Business features
  customer_portal: ['BUSINESS'],
  multi_currency: ['BUSINESS'],
  api_access: ['BUSINESS'],
  multi_user: ['BUSINESS'],
  cashflow_forecasts: ['BUSINESS'],
};

// Minimum tier required for each feature (for UI messaging)
const MINIMUM_TIER: Record<Feature, SubscriptionTier> = {
  recurring_invoices: 'STARTER',
  vat_reporting: 'STARTER',
  unlimited_invoices: 'STARTER',
  ocr_extraction: 'STARTER',
  expenses: 'STARTER',
  credit_notes: 'STARTER',
  export: 'STARTER',
  import: 'STARTER',
  time_tracking: 'PROFESSIONAL',
  analytics: 'PROFESSIONAL',
  payment_links: 'PROFESSIONAL',
  smart_reminders: 'PROFESSIONAL',
  accounting_integrations: 'PROFESSIONAL',
  unlimited_emails: 'PROFESSIONAL',
  tax_reporting: 'PROFESSIONAL',
  bulk_invoicing: 'PROFESSIONAL',
  customer_portal: 'BUSINESS',
  multi_currency: 'BUSINESS',
  api_access: 'BUSINESS',
  multi_user: 'BUSINESS',
  cashflow_forecasts: 'BUSINESS',
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
}> {
  const hasAccess = await hasFeatureAccess(userId, 'expenses');

  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'Onkosten bijhouden is beschikbaar vanaf het Starter abonnement',
    };
  }

  return { allowed: true };
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
    import: 'Import Functionaliteit',
    tax_reporting: 'Inkomstenbelasting Overzicht',
    ocr_extraction: 'OCR Bonnetjes Herkenning',
    credit_notes: 'Credit Nota\'s',
    customer_portal: 'Klantportaal',
    multi_currency: 'Multi-valuta',
    api_access: 'API Toegang',
    multi_user: 'Multi-gebruiker',
    bulk_invoicing: 'Bulk Facturatie',
    expenses: 'Onkosten Bijhouden',
    payment_links: 'iDEAL Betaallinks',
    smart_reminders: 'Slimme Herinneringen',
    accounting_integrations: 'Boekhoudkoppelingen',
    cashflow_forecasts: 'Cashflow Voorspellingen',
  };
  return names[feature];
}

export function isPremiumFeature(feature: Feature): boolean {
  return !FEATURE_ACCESS[feature].includes('FREE');
}
