import { requireSuperuser } from '@/lib/auth/admin-guard';
import { DiscountCodeManager } from '@/components/admin/discount-code-manager';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function DiscountCodesPage() {
  await requireSuperuser();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kortingscodes"
        subtitle="Beheer kortingscodes voor promoties en influencers"
      />

      <DiscountCodeManager />
    </div>
  );
}
