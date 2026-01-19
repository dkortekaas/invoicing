import { requireSuperuser } from '@/lib/auth/admin-guard';
import { Shield } from 'lucide-react';
import { AdminTabs } from '@/components/admin/admin-tabs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperuser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <AdminTabs />

      {children}
    </div>
  );
}
