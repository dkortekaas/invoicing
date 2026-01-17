import { db } from '@/lib/db';

export type Feature = 
  | 'recurring_invoices'
  | 'vat_reporting'
  | 'time_tracking'
  | 'analytics'
  | 'unlimited_invoices'
  | 'unlimited_emails'
  | 'export';

const FEATURE_ACCESS: Record<Feature, ('FREE' | 'PRO')[]> = {
  recurring_invoices: ['PRO'],
  vat_reporting: ['PRO'],
  time_tracking: ['PRO'],
  analytics: ['PRO'],
  unlimited_invoices: ['PRO'],
  unlimited_emails: ['PRO'],
  export: ['PRO'],
};

export async function hasFeatureAccess(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) return false;

  // Check if subscription is active
  if (user.subscriptionTier === 'PRO') {
    const isActive = ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus);
    const notExpired = user.stripeCurrentPeriodEnd 
      ? new Date(user.stripeCurrentPeriodEnd) > new Date()
      : false;

    if (isActive && notExpired) {
      return true;
    }
  }

  // Check if feature is available on free tier
  return FEATURE_ACCESS[feature].includes('FREE');
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
      subscriptionTier: true,
      subscriptionStatus: true,
      invoiceCount: true,
      invoiceCountResetAt: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Pro users have unlimited
  if (user.subscriptionTier === 'PRO' && 
      ['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus)) {
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
  };
  return names[feature];
}

export function isPremiumFeature(feature: Feature): boolean {
  return !FEATURE_ACCESS[feature].includes('FREE');
}
