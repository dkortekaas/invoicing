'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Invitation {
  id: string;
  email: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  role: 'USER' | 'ADMIN';
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | null;
  subscriptionDuration: number | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  receiver: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const SUBSCRIPTION_TIERS = [
  { value: '', label: 'Geen (gratis)', description: 'Standaard gratis account' },
  { value: 'STARTER', label: 'Starter', description: '€9/maand waarde' },
  { value: 'PROFESSIONAL', label: 'Professional', description: '€19/maand waarde' },
  { value: 'BUSINESS', label: 'Business', description: '€39/maand waarde' },
] as const;

const DURATION_OPTIONS = [
  { value: '1', label: '1 maand' },
  { value: '3', label: '3 maanden' },
  { value: '6', label: '6 maanden' },
  { value: '12', label: '1 jaar' },
  { value: '0', label: 'Onbeperkt' },
] as const;

export function InvitationManager() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  const [subscriptionDuration, setSubscriptionDuration] = useState<string>('12');
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (!response.ok) {
        throw new Error('Ophalen uitnodigingen mislukt');
      }
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Load invitations error:', error);
      toast.error('Ophalen uitnodigingen mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Voer een geldig e-mailadres in');
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = { email, role };

      // Add subscription tier if selected (not empty or 'none')
      if (subscriptionTier && subscriptionTier !== 'none') {
        payload.subscriptionTier = subscriptionTier;
        payload.subscriptionDuration = subscriptionDuration === '0' ? null : parseInt(subscriptionDuration);
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Uitnodiging versturen mislukt');
      }

      toast.success('Uitnodiging verstuurd');
      setEmail('');
      setSubscriptionTier('');
      setSubscriptionDuration('12');
      loadInvitations();
    } catch (error) {
      console.error('Send invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'Uitnodiging versturen mislukt');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Annuleren mislukt');
      }

      setCancelDialogOpen(null);
      toast.success('Uitnodiging geannuleerd');
      loadInvitations();
    } catch (error) {
      console.error('Cancel invitation error:', error);
      toast.error('Annuleren uitnodiging mislukt');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">In afwachting</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-800">Geaccepteerd</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Verlopen</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Geannuleerd</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/uitnodiging/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Uitnodigingslink gekopieerd');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gebruiker uitnodigen</CardTitle>
          <CardDescription>
            Nodig een nieuwe gebruiker uit om toegang te krijgen tot je account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="gebruiker@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'USER' | 'ADMIN')}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Gebruiker</SelectItem>
                  <SelectItem value="ADMIN">Beheerder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscriptionTier">Abonnement</Label>
              <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
                <SelectTrigger id="subscriptionTier">
                  <SelectValue placeholder="Geen (gratis)" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value || 'none'}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {subscriptionTier && subscriptionTier !== 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="subscriptionDuration">Looptijd abonnement</Label>
                <Select value={subscriptionDuration} onValueChange={setSubscriptionDuration}>
                  <SelectTrigger id="subscriptionDuration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <p className="text-sm text-muted-foreground">
                  Deze gebruiker krijgt een {SUBSCRIPTION_TIERS.find(t => t.value === subscriptionTier)?.label} abonnement
                  {subscriptionDuration === '0' ? ' voor onbepaalde tijd' : ` voor ${DURATION_OPTIONS.find(d => d.value === subscriptionDuration)?.label}`}
                  , zonder Stripe betaling.
                </p>
              </div>
            </div>
          )}

          <Button onClick={handleSendInvitation} disabled={sending || !email}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verzenden...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Uitnodiging versturen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uitnodigingen</CardTitle>
          <CardDescription>
            Overzicht van alle verzonden uitnodigingen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen uitnodigingen verstuurd</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mailadres</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verloopt op</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invitation.role === 'ADMIN' ? 'Beheerder' : 'Gebruiker'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.subscriptionTier ? (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-100 text-blue-800 w-fit">
                            {invitation.subscriptionTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {invitation.subscriptionDuration
                              ? `${invitation.subscriptionDuration} maand${invitation.subscriptionDuration > 1 ? 'en' : ''}`
                              : 'Onbeperkt'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.expiresAt), 'd MMM yyyy', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invitation.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInvitationLink(invitation.token)}
                            >
                              Link kopiëren
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelDialogOpen(invitation.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {invitation.status === 'ACCEPTED' && invitation.receiver && (
                          <span className="text-sm text-muted-foreground">
                            {invitation.receiver.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={cancelDialogOpen !== null} onOpenChange={(open) => !open && setCancelDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uitnodiging annuleren</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze uitnodiging wilt annuleren? De ontvanger kan deze uitnodiging dan niet meer accepteren.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(null)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelDialogOpen && handleCancelInvitation(cancelDialogOpen)}
            >
              Uitnodiging annuleren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
