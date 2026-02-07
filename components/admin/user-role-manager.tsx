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
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ShieldOff, Loader2 } from 'lucide-react';
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
                <div className="flex items-center gap-2">
                  <Badge variant={user.subscriptionTier === 'PRO' ? 'default' : 'secondary'}>
                    {user.subscriptionTier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {user.subscriptionStatus}
                  </span>
                </div>
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
    </Card>
  );
}
