import { requireSuperuser } from '@/lib/auth/admin-guard';
import { Shield } from 'lucide-react';
import Link from 'next/link';

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

      <nav className="flex gap-4 pb-4 border-b">
        <Link
          href="/admin"
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Overzicht
        </Link>
        <Link
          href="/admin/watermark"
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Watermerk
        </Link>
        <Link
          href="/admin/users"
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Gebruikers
        </Link>
      </nav>

      {children}
    </div>
  );
}
