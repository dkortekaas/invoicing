'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Search } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// PRO = legacy, treated as PROFESSIONAL
interface SubscriptionUser {
  id: string;
  name: string | null;
  email: string;
  companyName: string;
  subscriptionTier: 'FREE' | 'PRO' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID';
  billingCycle: 'MONTHLY' | 'YEARLY' | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  invoiceCount: number;
  invoiceCountResetAt: Date;
  createdAt: Date;
}

interface SubscriptionManagerProps {
  users: SubscriptionUser[];
}

export function SubscriptionManager({ users }: SubscriptionManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.companyName.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Actief</Badge>;
      case 'TRIALING':
        return <Badge className="bg-blue-100 text-blue-800">Proefperiode</Badge>;
      case 'FREE':
        return <Badge variant="outline">Gratis</Badge>;
      case 'PAST_DUE':
        return <Badge className="bg-yellow-100 text-yellow-800">Achterstallig</Badge>;
      case 'CANCELED':
        return <Badge variant="secondary">Geannuleerd</Badge>;
      case 'INCOMPLETE':
        return <Badge className="bg-orange-100 text-orange-800">Incompleet</Badge>;
      case 'INCOMPLETE_EXPIRED':
        return <Badge variant="secondary">Incompleet (verlopen)</Badge>;
      case 'UNPAID':
        return <Badge className="bg-red-100 text-red-800">Onbetaald</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return <Badge variant="outline">FREE</Badge>;
      case 'STARTER':
        return <Badge className="bg-slate-100 text-slate-800">Starter</Badge>;
      case 'PRO':
      case 'PROFESSIONAL':
        return <Badge className="bg-blue-100 text-blue-800">Professional</Badge>;
      case 'BUSINESS':
        return <Badge className="bg-purple-100 text-purple-800">Business</Badge>;
      default:
        return <Badge>{tier}</Badge>;
    }
  };

  const stats = {
    total: users.length,
    paid: users.filter((u) => u.subscriptionTier !== 'FREE').length,
    active: users.filter((u) => u.subscriptionStatus === 'ACTIVE').length,
    free: users.filter((u) => u.subscriptionTier === 'FREE').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totaal gebruikers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
            <div className="text-sm text-muted-foreground">Betaalde accounts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Actieve abonnementen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.free}</div>
            <div className="text-sm text-muted-foreground">Gratis accounts</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Abonnementen</CardTitle>
          <CardDescription>
            Overzicht van alle gebruikers en hun abonnementsstatus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="search">Zoeken</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Zoek op naam, e-mail of bedrijfsnaam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Geen gebruikers gevonden</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Betalingscyclus</TableHead>
                    <TableHead>Verloopt op</TableHead>
                    <TableHead>Facturen</TableHead>
                    <TableHead>Stripe ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Geen naam'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>{getTierBadge(user.subscriptionTier)}</TableCell>
                      <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
                      <TableCell>
                        {user.billingCycle ? (
                          <Badge variant="outline">
                            {user.billingCycle === 'MONTHLY' ? 'Maandelijks' : 'Jaarlijks'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.stripeCurrentPeriodEnd ? (
                          <div>
                            {format(new Date(user.stripeCurrentPeriodEnd), 'd MMM yyyy', {
                              locale: nl,
                            })}
                            {new Date(user.stripeCurrentPeriodEnd) < new Date() && (
                              <Badge variant="destructive" className="ml-2">
                                Verlopen
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{user.invoiceCount}</div>
                          <div className="text-muted-foreground text-xs">
                            Reset: {format(new Date(user.invoiceCountResetAt), 'd MMM', {
                              locale: nl,
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.stripeCustomerId ? (
                          <div className="text-xs font-mono text-muted-foreground">
                            {user.stripeCustomerId.substring(0, 20)}...
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
