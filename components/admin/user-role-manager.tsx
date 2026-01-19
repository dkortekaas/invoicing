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
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
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
    </Card>
  );
}
