'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Copy, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minTier: string;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  campaign: string | null;
  source: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    usages: number;
  };
}

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage', symbol: '%' },
  { value: 'FIXED_AMOUNT', label: 'Vast bedrag', symbol: '€' },
] as const;

const SUBSCRIPTION_TIERS = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'BUSINESS', label: 'Business' },
] as const;

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minTier, setMinTier] = useState('STARTER');
  const [validUntil, setValidUntil] = useState('');
  const [campaign, setCampaign] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes');
      if (!response.ok) throw new Error('Ophalen mislukt');
      const data = await response.json();
      setCodes(data);
    } catch (error) {
      console.error('Load codes error:', error);
      toast.error('Ophalen kortingscodes mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!code || !discountValue) {
      toast.error('Code en waarde zijn verplicht');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description: description || null,
          discountType,
          discountValue: parseInt(discountValue),
          maxUses: maxUses ? parseInt(maxUses) : null,
          minTier,
          validUntil: validUntil || null,
          campaign: campaign || null,
          source: source || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Aanmaken mislukt');
      }

      toast.success('Kortingscode aangemaakt');
      resetForm();
      loadCodes();
    } catch (error) {
      console.error('Create code error:', error);
      toast.error(error instanceof Error ? error.message : 'Aanmaken mislukt');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Bijwerken mislukt');

      toast.success(isActive ? 'Kortingscode geactiveerd' : 'Kortingscode gedeactiveerd');
      loadCodes();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('Bijwerken mislukt');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Verwijderen mislukt');

      const result = await response.json();
      if (result.deactivated) {
        toast.success('Kortingscode gedeactiveerd (was al gebruikt)');
      } else {
        toast.success('Kortingscode verwijderd');
      }
      setDeleteDialogOpen(null);
      loadCodes();
    } catch (error) {
      console.error('Delete code error:', error);
      toast.error('Verwijderen mislukt');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code gekopieerd');
  };

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMaxUses('');
    setMinTier('STARTER');
    setValidUntil('');
    setCampaign('');
    setSource('');
  };

  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'PERCENTAGE') return `${value}%`;
    return `€${(value / 100).toFixed(2)}`;
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
          <CardTitle>Nieuwe kortingscode</CardTitle>
          <CardDescription>
            Maak een kortingscode aan voor promoties en influencers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="INFLUENCER20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label htmlFor="discountType">Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'PERCENTAGE' | 'FIXED_AMOUNT')}>
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue">
                Waarde * {discountType === 'PERCENTAGE' ? '(%)' : '(€ in centen)'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                placeholder={discountType === 'PERCENTAGE' ? '20' : '1000'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxUses">Max gebruik (leeg = onbeperkt)</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="100"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="minTier">Minimaal abonnement</Label>
              <Select value={minTier} onValueChange={setMinTier}>
                <SelectTrigger id="minTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="validUntil">Geldig tot (leeg = geen einddatum)</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="campaign">Campagne</Label>
              <Input
                id="campaign"
                placeholder="instagram_q1_2025"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="source">Bron / Influencer</Label>
              <Input
                id="source"
                placeholder="@username"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschrijving (intern)</Label>
            <Textarea
              id="description"
              placeholder="Interne notities over deze kortingscode..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={handleCreate} disabled={creating || !code || !discountValue}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aanmaken...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Kortingscode aanmaken
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kortingscodes</CardTitle>
          <CardDescription>
            Overzicht van alle kortingscodes en hun gebruik
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen kortingscodes aangemaakt</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Korting</TableHead>
                  <TableHead>Gebruik</TableHead>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((discountCode) => (
                  <TableRow key={discountCode.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {discountCode.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(discountCode.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDiscountValue(discountCode.discountType, discountCode.discountValue)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {discountCode._count.usages}
                        {discountCode.maxUses && ` / ${discountCode.maxUses}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {discountCode.campaign || discountCode.source ? (
                        <div className="text-sm">
                          {discountCode.campaign && (
                            <div className="text-muted-foreground">{discountCode.campaign}</div>
                          )}
                          {discountCode.source && (
                            <div className="font-medium">{discountCode.source}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {discountCode.validUntil ? (
                        <span className={new Date(discountCode.validUntil) < new Date() ? 'text-red-500' : ''}>
                          {format(new Date(discountCode.validUntil), 'd MMM yyyy', { locale: nl })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Onbeperkt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={discountCode.isActive}
                          onCheckedChange={(checked) => handleToggleActive(discountCode.id, checked)}
                        />
                        <span className="text-sm">
                          {discountCode.isActive ? 'Actief' : 'Inactief'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(discountCode.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kortingscode verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze kortingscode wilt verwijderen? Als de code al is gebruikt, wordt deze gedeactiveerd in plaats van verwijderd.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
