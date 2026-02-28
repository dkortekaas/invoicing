'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

// ============================================================
// Types
// ============================================================

interface ConnectionSettings {
  id: string
  provider: string
  providerName: string
  isActive: boolean
  autoSyncInvoices: boolean
  autoSyncCreditNotes: boolean
  autoSyncCustomers: boolean
  existingCustomerStrategy: string | null
}

// ============================================================
// Saved confirmation badge
// ============================================================

function SavedBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 text-xs text-green-700 transition-opacity duration-300 ' +
        (visible ? 'opacity-100' : 'opacity-0')
      }
      aria-live="polite"
    >
      <Check className="h-3 w-3" />
      Opgeslagen
    </span>
  )
}

// ============================================================
// Loading skeleton
// ============================================================

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function ProviderSettingsPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = use(params)
  const providerKey = provider.toUpperCase()
  const router = useRouter()

  // ── Remote state ────────────────────────────────────────────
  const [conn, setConn] = useState<ConnectionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Section 1: Connection name ──────────────────────────────
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  // ── Section 2: Auto-sync toggles ───────────────────────────
  const [toggleSaved, setToggleSaved] = useState<Record<string, boolean>>({})
  const [toggleSaving, setToggleSaving] = useState<Record<string, boolean>>({})

  // ── Section 3: Existing customer strategy ──────────────────
  const [strategySaved, setStrategySaved] = useState(false)

  // ── Section 4: Disconnect dialog ───────────────────────────
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)
  const confirmInputRef = useRef<HTMLInputElement>(null)

  // ── Load settings on mount ──────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/accounting/settings')
        if (!res.ok) throw new Error('Laden mislukt')
        const data = await res.json() as { connections: ConnectionSettings[] }
        const found = data.connections.find((c) => c.provider === providerKey)
        if (!found) throw new Error('Geen actieve koppeling gevonden voor deze provider')
        setConn(found)
        setNameValue(found.providerName)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Onbekende fout')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [providerKey])

  // Focus confirm input when dialog opens
  useEffect(() => {
    if (disconnectOpen) {
      setConfirmText('')
      setTimeout(() => confirmInputRef.current?.focus(), 50)
    }
  }, [disconnectOpen])

  // ── PATCH helper ────────────────────────────────────────────
  async function patch(payload: Record<string, unknown>): Promise<ConnectionSettings | null> {
    if (!conn) return null
    const res = await fetch('/api/accounting/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: conn.id, ...payload }),
    })
    if (!res.ok) throw new Error('Opslaan mislukt')
    return res.json() as Promise<ConnectionSettings>
  }

  // ── Save connection name ────────────────────────────────────
  async function saveName() {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === conn?.providerName) return
    setNameSaving(true)
    try {
      const updated = await patch({ providerName: trimmed })
      if (updated) setConn(updated)
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    } catch {
      toast.error('Verbindingsnaam opslaan mislukt')
    } finally {
      setNameSaving(false)
    }
  }

  // ── Toggle auto-sync fields ─────────────────────────────────
  async function saveToggle(field: string, value: boolean) {
    setToggleSaving((prev) => ({ ...prev, [field]: true }))
    try {
      const updated = await patch({ [field]: value })
      if (updated) setConn(updated)
      setToggleSaved((prev) => ({ ...prev, [field]: true }))
      setTimeout(
        () => setToggleSaved((prev) => ({ ...prev, [field]: false })),
        2500,
      )
    } catch {
      toast.error('Instelling opslaan mislukt')
    } finally {
      setToggleSaving((prev) => ({ ...prev, [field]: false }))
    }
  }

  // ── Save customer strategy ──────────────────────────────────
  async function saveStrategy(value: string) {
    try {
      const updated = await patch({ existingCustomerStrategy: value })
      if (updated) setConn(updated)
      setStrategySaved(true)
      setTimeout(() => setStrategySaved(false), 2500)
    } catch {
      toast.error('Instelling opslaan mislukt')
    }
  }

  // ── Disconnect ──────────────────────────────────────────────
  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/accounting/disconnect/${provider}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(`${conn?.providerName ?? 'Koppeling'} verbroken`)
      router.push('/dashboard/settings/accounting')
    } catch {
      toast.error('Koppeling verbreken mislukt')
      setDisconnecting(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────
  const providerDisplayName = conn?.providerName ?? provider

  // ── Render: loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <SettingsSkeleton />
      </div>
    )
  }

  // ── Render: error ───────────────────────────────────────────
  if (loadError || !conn) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/settings/accounting"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Boekhoudkoppelingen
        </Link>
        <p className="text-sm text-destructive">{loadError ?? 'Onbekende fout'}</p>
      </div>
    )
  }

  // ── Render: main ────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/dashboard/settings/accounting"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Boekhoudkoppelingen
      </Link>

      <div>
        <h2 className="text-xl font-bold">Instellingen – {providerDisplayName}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Beheer de synchronisatie-instellingen voor deze koppeling.
        </p>
      </div>

      {/* ── Section 1: Connection name ─────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Verbindingsnaam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Een herkenbare naam voor deze koppeling, bijv. &lsquo;Moneybird – Mijn
            Administratie&rsquo;.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="provider-name">Naam</Label>
            <Input
              id="provider-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveName()
              }}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => void saveName()}
              disabled={nameSaving || !nameValue.trim() || nameValue.trim() === conn.providerName}
            >
              {nameSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Opslaan
            </Button>
            <SavedBadge visible={nameSaved} />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Auto-sync toggles ──────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Automatische synchronisatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          {/* Facturen */}
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync-invoices" className="text-sm font-medium cursor-pointer">
                Facturen automatisch syncen bij verzenden
              </Label>
              <p className="text-muted-foreground text-xs">
                Elke factuur wordt direct gesynchroniseerd zodra je op &lsquo;Verzenden&rsquo;
                klikt.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SavedBadge visible={!!toggleSaved['autoSyncInvoices']} />
              {toggleSaving['autoSyncInvoices'] ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  id="auto-sync-invoices"
                  checked={conn.autoSyncInvoices}
                  onCheckedChange={(val) => {
                    setConn({ ...conn, autoSyncInvoices: val })
                    void saveToggle('autoSyncInvoices', val)
                  }}
                />
              )}
            </div>
          </div>

          {/* Credit nota's */}
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="space-y-0.5">
              <Label
                htmlFor="auto-sync-credit-notes"
                className="text-sm font-medium cursor-pointer"
              >
                Credit nota&apos;s automatisch syncen
              </Label>
              <p className="text-muted-foreground text-xs">
                Credit nota&apos;s worden automatisch aangemaakt in je boekhoudpakket.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SavedBadge visible={!!toggleSaved['autoSyncCreditNotes']} />
              {toggleSaving['autoSyncCreditNotes'] ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  id="auto-sync-credit-notes"
                  checked={conn.autoSyncCreditNotes}
                  onCheckedChange={(val) => {
                    setConn({ ...conn, autoSyncCreditNotes: val })
                    void saveToggle('autoSyncCreditNotes', val)
                  }}
                />
              )}
            </div>
          </div>

          {/* Klanten */}
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="space-y-0.5">
              <Label
                htmlFor="auto-sync-customers"
                className="text-sm font-medium cursor-pointer"
              >
                Klanten automatisch aanmaken
              </Label>
              <p className="text-muted-foreground text-xs">
                Nieuwe klanten worden automatisch aangemaakt in je boekhoudpakket bij de eerste
                factuur.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SavedBadge visible={!!toggleSaved['autoSyncCustomers']} />
              {toggleSaving['autoSyncCustomers'] ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  id="auto-sync-customers"
                  checked={conn.autoSyncCustomers}
                  onCheckedChange={(val) => {
                    setConn({ ...conn, autoSyncCustomers: val })
                    void saveToggle('autoSyncCustomers', val)
                  }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Existing customer strategy ─────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bestaande klanten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Wat moet Declair doen als een klant mogelijk al bestaat in{' '}
            {providerDisplayName}?
          </p>
          <div className="flex items-center gap-3">
            <Select
              value={conn.existingCustomerStrategy ?? 'FIND_BY_EMAIL'}
              onValueChange={(val) => {
                setConn({ ...conn, existingCustomerStrategy: val })
                void saveStrategy(val)
              }}
            >
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIND_BY_EMAIL">
                  Zoek op e-mailadres (aanbevolen)
                </SelectItem>
                <SelectItem value="ALWAYS_CREATE">Altijd nieuw aanmaken</SelectItem>
                <SelectItem value="ASK">Vraag elke keer</SelectItem>
              </SelectContent>
            </Select>
            <SavedBadge visible={strategySaved} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Section 4: Danger zone ─────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-4 w-4" />
            Verbinding verbreken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dit verwijdert de koppeling en alle sync-geschiedenis. Je facturen in{' '}
            <span className="font-medium text-foreground">{providerDisplayName}</span> blijven
            gewoon bewaard.
          </p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDisconnectOpen(true)}
          >
            Koppeling verbreken
          </Button>
        </CardContent>
      </Card>

      {/* ── Disconnect confirmation dialog ─────────────────── */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koppeling verbreken?</DialogTitle>
            <DialogDescription>
              Typ <strong>{providerDisplayName}</strong> ter bevestiging. Alle
              synchronisatiedata en mappings worden permanent verwijderd. Je gegevens in{' '}
              {providerDisplayName} blijven onaangeroerd.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="confirm-disconnect">Bevestig door de naam in te typen</Label>
            <Input
              id="confirm-disconnect"
              ref={confirmInputRef}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmText === providerDisplayName) {
                  void handleDisconnect()
                }
              }}
              placeholder={providerDisplayName}
              disabled={disconnecting}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisconnectOpen(false)}
              disabled={disconnecting}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDisconnect()}
              disabled={confirmText !== providerDisplayName || disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Definitief verbreken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
