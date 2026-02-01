import { requireSuperuser } from '@/lib/auth/admin-guard';
import { DiscountCodeManager } from '@/components/admin/discount-code-manager';

export default async function DiscountCodesPage() {
  await requireSuperuser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Kortingscodes</h2>
        <p className="text-muted-foreground">
          Beheer kortingscodes voor promoties en influencers
        </p>
      </div>

      <DiscountCodeManager />
    </div>
  );
}
