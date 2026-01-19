import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function CheckoutCanceledPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Betaling geannuleerd</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Je betaling is geannuleerd. Je abonnement is niet gewijzigd.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button asChild>
              <Link href="/upgrade">Probeer opnieuw</Link>
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
