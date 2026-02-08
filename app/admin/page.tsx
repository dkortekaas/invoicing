import { requireSuperuser } from '@/lib/auth/admin-guard';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Shield } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function AdminPage() {
  await requireSuperuser();

  const [userCount, invoiceCount, settings] = await Promise.all([
    db.user.count(),
    db.invoice.count(),
    db.systemSettings.findUnique({ where: { id: 'default' } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Overzicht"
        subtitle="Beheer systeeminstellingen en gebruikers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Totaal geregistreerd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceCount}</div>
            <p className="text-xs text-muted-foreground">Totaal gegenereerd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watermerk</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings?.watermarkEnabled ? 'Actief' : 'Uitgeschakeld'}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings?.freeUserWatermarkEnabled ? 'Voor free users' : 'Uitgeschakeld'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
