import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasFeatureAccess, Feature } from '@/lib/stripe/subscriptions';

export async function requireFeature(feature: Feature) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const hasAccess = await hasFeatureAccess(session.user.id, feature);

  if (!hasAccess) {
    redirect('/upgrade?feature=' + feature);
  }
}

export async function getFeatureAccess(feature: Feature): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.id) {
    return false;
  }

  return hasFeatureAccess(session.user.id, feature);
}
