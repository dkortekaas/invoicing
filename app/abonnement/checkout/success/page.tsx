import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Betaling geslaagd!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Je Pro abonnement is nu actief. Je hebt nu toegang tot alle premium features.
          </p>
          
          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Sessie ID: {sessionId}
            </p>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button asChild>
              <Link href="/abonnement">Bekijk abonnement</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Naar dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
