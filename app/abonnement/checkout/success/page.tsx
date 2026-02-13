import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SyncAfterCheckout } from '@/components/subscription/sync-after-checkout';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <SyncAfterCheckout />
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Betaling geslaagd!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Je abonnement is nu actief. Je hebt nu toegang tot alle bijbehorende functies.
          </p>
          <p className="text-sm text-muted-foreground">
            Je kunt je abonnement en facturen beheren onder Instellingen → Abonnement.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button asChild>
              <Link href="/instellingen?tab=abonnement">Bekijk abonnement</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Naar dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
