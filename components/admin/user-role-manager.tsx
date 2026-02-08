'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ShieldOff, Loader2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
  isManualSubscription: boolean;
  manualSubscriptionExpiresAt: Date | null;
  manualSubscriptionNote: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  invoiceCount: number;
}

interface UserRoleManagerProps {
  users: User[];
}

export function UserRoleManager({ users }: UserRoleManagerProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [resetting2FA, setResetting2FA] = useState<string | null>(null);
  const [confirmResetUser, setConfirmResetUser] = useState<User | null>(null);
  const [editSubUser, setEditSubUser] = useState<User | null>(null);
  const [savingSub, setSavingSub] = useState(false);

  // Subscription edit form state
  const [subTier, setSubTier] = useState('FREE');
  const [subStatus, setSubStatus] = useState('FREE');
  const [subManual, setSubManual] = useState(false);
  const [subExpiresAt, setSubExpiresAt] = useState('');
  const [subNote, setSubNote] = useState('');

  const openSubscriptionDialog = (user: User) => {
    setEditSubUser(user);
    setSubTier(user.subscriptionTier);
    setSubStatus(user.subscriptionStatus);
    setSubManual(user.isManualSubscription);
    setSubExpiresAt(
      user.manualSubscriptionExpiresAt
        ? new Date(user.manualSubscriptionExpiresAt).toISOString().slice(0, 10)
        : ''
    );
    setSubNote(user.manualSubscriptionNote || '');
  };

  const handleSubscriptionSave = async () => {
    if (!editSubUser) return;
    setSavingSub(true);
    try {
      const response = await fetch(`/api/admin/users/${editSubUser.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: subTier,
          subscriptionStatus: subTier === 'FREE' ? 'FREE' : subStatus,
          isManualSubscription: subTier === 'FREE' ? false : subManual,
          manualSubscriptionExpiresAt: subTier === 'FREE' || !subExpiresAt ? null : subExpiresAt,
          manualSubscriptionNote: subTier === 'FREE' ? null : subNote,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Abonnement bijwerken mislukt');
      }

      setEditSubUser(null);
      router.refresh();
      toast.success('Abonnement bijgewerkt');
    } catch (error) {
      console.error('Update subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setSavingSub(false);
    }
  };

  const handleReset2FA = async (userId: string) => {
    setResetting2FA(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/2fa`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '2FA resetten mislukt');
      }

      setConfirmResetUser(null);
      router.refresh();
      toast.success('2FA gereset. Gebruiker kan weer inloggen zonder 2FA.');
    } catch (error) {
      console.error('Reset 2FA error:', error);
      toast.error(error instanceof Error ? error.message : '2FA resetten mislukt');
    } finally {
      setResetting2FA(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      router.refresh();
      toast.success('Rol bijgewerkt');
    } catch (error) {
      console.error('Update role error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setUpdating(null);
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

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gebruiker</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Abonnement</TableHead>
            <TableHead>Facturen</TableHead>
            <TableHead>Aangemaakt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name || 'Geen naam'}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={updating === user.id}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Gebruiker</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="SUPERUSER">Superuser</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.twoFactorEnabled ? (
                    <>
                      <Badge variant="secondary">Aan</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={resetting2FA === user.id}
                        onClick={() => setConfirmResetUser(user)}
                        title="2FA resetten"
                      >
                        {resetting2FA === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldOff className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Uit</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <button
                  className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openSubscriptionDialog(user)}
                  title="Abonnement wijzigen"
                >
                  {getTierBadge(user.subscriptionTier)}
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </TableCell>
              <TableCell>{user.invoiceCount}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: nl })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Geen gebruikers gevonden
        </div>
      )}

      {/* 2FA Reset Dialog */}
      <Dialog open={!!confirmResetUser} onOpenChange={(open) => !open && setConfirmResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>2FA resetten</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je twee-factor authenticatie wilt uitschakelen voor{' '}
              <strong>{confirmResetUser?.email}</strong>? De gebruiker kan daarna weer inloggen met
              alleen wachtwoord en kan 2FA opnieuw inschakelen in de instellingen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResetUser(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              disabled={confirmResetUser ? resetting2FA === confirmResetUser.id : false}
              onClick={() => confirmResetUser && handleReset2FA(confirmResetUser.id)}
            >
              {confirmResetUser && resetting2FA === confirmResetUser.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              2FA resetten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Edit Dialog */}
      <Dialog open={!!editSubUser} onOpenChange={(open) => !open && setEditSubUser(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Abonnement wijzigen</DialogTitle>
            <DialogDescription>
              Wijzig het abonnement van <strong>{editSubUser?.name || editSubUser?.email}</strong>.
              {editSubUser?.stripeSubscriptionId && (
                <span className="block mt-1 text-yellow-600">
                  Let op: deze gebruiker heeft een actief Stripe-abonnement. Wijzigingen hier overschrijven de lokale status, maar niet Stripe.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={subTier} onValueChange={setSubTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {subTier !== 'FREE' && (
              <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={subStatus} onValueChange={setSubStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Actief</SelectItem>
                      <SelectItem value="TRIALING">Proefperiode</SelectItem>
                      <SelectItem value="PAST_DUE">Achterstallig</SelectItem>
                      <SelectItem value="CANCELED">Geannuleerd</SelectItem>
                      <SelectItem value="UNPAID">Onbetaald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="manual-sub">Handmatig abonnement</Label>
                    <p className="text-xs text-muted-foreground">
                      Bypass Stripe, door admin toegekend
                    </p>
                  </div>
                  <Switch
                    id="manual-sub"
                    checked={subManual}
                    onCheckedChange={setSubManual}
                  />
                </div>

                {subManual && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="expires-at">Verloopt op</Label>
                      <Input
                        id="expires-at"
                        type="date"
                        value={subExpiresAt}
                        onChange={(e) => setSubExpiresAt(e.target.value)}
                        placeholder="Leeg = onbeperkt"
                      />
                      <p className="text-xs text-muted-foreground">
                        Laat leeg voor een onbeperkt abonnement
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sub-note">Notitie</Label>
                      <Textarea
                        id="sub-note"
                        value={subNote}
                        onChange={(e) => setSubNote(e.target.value)}
                        placeholder="Bijv. 'Influencer deal - @username'"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubUser(null)}>
              Annuleren
            </Button>
            <Button onClick={handleSubscriptionSave} disabled={savingSub}>
              {savingSub && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
