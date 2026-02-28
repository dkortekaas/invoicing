'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ============================================================
// Types
// ============================================================

interface VatCode {
  id: string
  name: string
  percentage: number
  taxRateType?: string
}

interface LedgerAccount {
  id: string
  code?: string
  name: string
}

interface VatMappingRow {
  id: string
  connectionId: string
  vatRate: number
  externalVatId: string
  externalVatCode: string | null
  externalVatName: string | null
  connection: { provider: string; providerName: string }
}

interface LedgerMappingRow {
  id: string
  connectionId: string
  sourceType: 'DEFAULT' | 'PRODUCT_CATEGORY' | 'PRODUCT'
  sourceId: string | null
  externalLedgerId: string
  externalLedgerCode: string | null
  externalLedgerName: string | null
  connection: { provider: string; providerName: string }
}

interface PageData {
  connectionId: string
  providerName: string
  vatCodes: VatCode[]
  ledgers: LedgerAccount[]
}

const VAT_RATES = [0, 9, 21] as const

// ============================================================
// Helpers
// ============================================================

function ledgerLabel(l: LedgerAccount): string {
  return l.code ? `${l.code} – ${l.name}` : l.name
}

// ============================================================
// Save-state indicator
// ============================================================

function SaveIndicator({ state }: { state: 'saving' | 'saved' | undefined }) {
  if (state === 'saving') {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
  }
  if (state === 'saved') {
    return <Check className="h-4 w-4 text-green-600 shrink-0" />
  }
  return <span className="h-4 w-4 shrink-0 inline-block" />
}

// ============================================================
// Loading skeleton
// ============================================================

function MappingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-44" />
      <Card>
        <CardContent className="pt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-9 w-64" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-72" />
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function MappingsPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = use(params)
  const providerKey = provider.toUpperCase()

  // ── Remote data ────────────────────────────────────────────
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Local mapping state (pre-filtered for this provider) ───
  const [vatMappings, setVatMappings] = useState<VatMappingRow[]>([])
  const [ledgerMappings, setLedgerMappings] = useState<LedgerMappingRow[]>([])

  // ── Per-row save indicators: key → 'saving' | 'saved' ─────
  const [saveStates, setSaveStates] = useState<Record<string, 'saving' | 'saved'>>({})

  // ── Add-row state: category ─────────────────────────────────
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryLedgerId, setNewCategoryLedgerId] = useState('')

  // ── Add-row state: product ──────────────────────────────────
  const [addingProduct, setAddingProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductLedgerId, setNewProductLedgerId] = useState('')

  // ── Initial data fetch ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [vatCodesRes, ledgersRes, vatMappingsRes, ledgerMappingsRes, settingsRes] =
          await Promise.all([
            fetch(`/api/accounting/${provider}/vat-codes`),
            fetch(`/api/accounting/${provider}/ledgers`),
            fetch('/api/accounting/mappings/vat'),
            fetch('/api/accounting/mappings/ledger'),
            fetch('/api/accounting/settings'),
          ])

        if (!settingsRes.ok) throw new Error('Kan instellingen niet laden')

        const [vatCodesData, ledgersData, vatMappingsData, ledgerMappingsData, settingsData] =
          await Promise.all([
            vatCodesRes.ok ? vatCodesRes.json() : { vatCodes: [] },
            ledgersRes.ok ? ledgersRes.json() : { ledgers: [] },
            vatMappingsRes.ok ? vatMappingsRes.json() : { mappings: [] },
            ledgerMappingsRes.ok ? ledgerMappingsRes.json() : { mappings: [] },
            settingsRes.json(),
          ])

        const conn = (settingsData.connections as Array<{ id: string; provider: string; providerName: string }> | undefined)?.find(
          (c) => c.provider === providerKey,
        )
        if (!conn) throw new Error('Geen actieve koppeling gevonden voor deze provider')

        const allVatMappings = (vatMappingsData.mappings ?? []) as VatMappingRow[]
        const allLedgerMappings = (ledgerMappingsData.mappings ?? []) as LedgerMappingRow[]

        setPageData({
          connectionId: conn.id,
          providerName: conn.providerName,
          vatCodes: vatCodesData.vatCodes ?? [],
          ledgers: ledgersData.ledgers ?? [],
        })
        setVatMappings(allVatMappings.filter((m) => m.connection.provider === providerKey))
        setLedgerMappings(allLedgerMappings.filter((m) => m.connection.provider === providerKey))
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Laden mislukt')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [provider, providerKey])

  // ── Save-state helpers ──────────────────────────────────────
  function startSaving(key: string) {
    setSaveStates((prev) => ({ ...prev, [key]: 'saving' }))
  }

  function markSaved(key: string) {
    setSaveStates((prev) => ({ ...prev, [key]: 'saved' }))
    setTimeout(() => {
      setSaveStates((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, 2000)
  }

  function clearSaving(key: string) {
    setSaveStates((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // ── Save VAT mapping ────────────────────────────────────────
  async function saveVatMapping(vatRate: number, vatCode: VatCode) {
    if (!pageData) return
    const key = `vat-${vatRate}`
    startSaving(key)
    try {
      const res = await fetch('/api/accounting/mappings/vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: pageData.connectionId,
          vatRate,
          externalVatId: vatCode.id,
          externalVatCode: vatCode.taxRateType ?? null,
          externalVatName: vatCode.name,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json() as VatMappingRow
      setVatMappings((prev) => [
        ...prev.filter((m) => Number(m.vatRate) !== vatRate),
        { ...saved, connection: { provider: providerKey, providerName: pageData.providerName } },
      ])
      markSaved(key)
    } catch {
      toast.error('BTW-koppeling opslaan mislukt')
      clearSaving(key)
    }
  }

  // ── Save ledger mapping ─────────────────────────────────────
  async function saveLedgerMapping(
    sourceType: LedgerMappingRow['sourceType'],
    sourceId: string | null,
    ledger: LedgerAccount,
    key: string,
  ) {
    if (!pageData) return
    startSaving(key)
    try {
      const res = await fetch('/api/accounting/mappings/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: pageData.connectionId,
          sourceType,
          sourceId,
          externalLedgerId: ledger.id,
          externalLedgerCode: ledger.code ?? null,
          externalLedgerName: ledger.name,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json() as LedgerMappingRow
      setLedgerMappings((prev) => [
        ...prev.filter((m) => !(m.sourceType === sourceType && m.sourceId === sourceId)),
        { ...saved, connection: { provider: providerKey, providerName: pageData.providerName } },
      ])
      markSaved(key)
    } catch {
      toast.error('Grootboekkoppeling opslaan mislukt')
      clearSaving(key)
    }
  }

  // ── Delete ledger mapping ───────────────────────────────────
  async function deleteLedgerMapping(id: string) {
    try {
      const res = await fetch(`/api/accounting/mappings/ledger/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLedgerMappings((prev) => prev.filter((m) => m.id !== id))
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  // ── Add category mapping ────────────────────────────────────
  async function handleAddCategory() {
    if (!pageData || !newCategoryName.trim() || !newCategoryLedgerId) return
    const ledger = pageData.ledgers.find((l) => l.id === newCategoryLedgerId)
    if (!ledger) return
    await saveLedgerMapping('PRODUCT_CATEGORY', newCategoryName.trim(), ledger, `ledger-add-cat`)
    setAddingCategory(false)
    setNewCategoryName('')
    setNewCategoryLedgerId('')
  }

  // ── Add product mapping ─────────────────────────────────────
  async function handleAddProduct() {
    if (!pageData || !newProductName.trim() || !newProductLedgerId) return
    const ledger = pageData.ledgers.find((l) => l.id === newProductLedgerId)
    if (!ledger) return
    await saveLedgerMapping('PRODUCT', newProductName.trim(), ledger, `ledger-add-prod`)
    setAddingProduct(false)
    setNewProductName('')
    setNewProductLedgerId('')
  }

  // ── Derived state for preview ───────────────────────────────
  const vatMapping21 = vatMappings.find((m) => Number(m.vatRate) === 21)
  const defaultLedger = ledgerMappings.find((m) => m.sourceType === 'DEFAULT')
  const categoryMappings = ledgerMappings.filter((m) => m.sourceType === 'PRODUCT_CATEGORY')
  const productMappings = ledgerMappings.filter((m) => m.sourceType === 'PRODUCT')

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <MappingsSkeleton />
      </div>
    )
  }

  if (loadError || !pageData) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/settings/accounting"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Boekhoudkoppelingen
        </Link>
        <p className="text-sm text-destructive">{loadError ?? 'Onbekende fout bij laden'}</p>
      </div>
    )
  }

  // ── Select options (shared) ─────────────────────────────────
  const ledgerOptions = pageData.ledgers.map((l) => (
    <SelectItem key={l.id} value={l.id}>
      {ledgerLabel(l)}
    </SelectItem>
  ))

  const noLedgers = (
    <SelectItem value="__empty__" disabled>
      Geen grootboekrekeningen beschikbaar
    </SelectItem>
  )

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

      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold">Koppelinginstellingen</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Koppel BTW-tarieven en omzetrekeningen aan {pageData.providerName}.
        </p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Tabs defaultValue="btw">
        <TabsList>
          <TabsTrigger value="btw">BTW Codes</TabsTrigger>
          <TabsTrigger value="grootboek">Grootboekrekeningen</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: BTW Codes ──────────────────────────────── */}
        <TabsContent value="btw" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">BTW-tarieven koppelen</CardTitle>
              <p className="text-muted-foreground text-sm">
                Koppel elk Declair-tarief aan een BTW-code in {pageData.providerName}.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {VAT_RATES.map((rate) => {
                const key = `vat-${rate}`
                const current = vatMappings.find((m) => Number(m.vatRate) === rate)
                return (
                  <div key={rate} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium shrink-0">BTW {rate}%</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select
                      value={current?.externalVatId ?? ''}
                      onValueChange={(id) => {
                        const vc = pageData.vatCodes.find((c) => c.id === id)
                        if (vc) void saveVatMapping(rate, vc)
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecteer BTW-code…" />
                      </SelectTrigger>
                      <SelectContent>
                        {pageData.vatCodes.length === 0 ? (
                          <SelectItem value="__empty__" disabled>
                            Geen BTW-codes beschikbaar
                          </SelectItem>
                        ) : (
                          pageData.vatCodes.map((vc) => (
                            <SelectItem key={vc.id} value={vc.id}>
                              {vc.name} ({vc.percentage}%)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <SaveIndicator state={saveStates[key]} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Grootboekrekeningen ────────────────────── */}
        <TabsContent value="grootboek" className="mt-4 space-y-4">
          {/* Standaard rekening */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Standaard grootboekrekening</CardTitle>
              <p className="text-muted-foreground text-sm">
                Wordt gebruikt als geen specifiekere koppeling van toepassing is.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Select
                  value={defaultLedger?.externalLedgerId ?? ''}
                  onValueChange={(id) => {
                    const l = pageData.ledgers.find((x) => x.id === id)
                    if (l) void saveLedgerMapping('DEFAULT', null, l, 'ledger-DEFAULT')
                  }}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Selecteer rekening…" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageData.ledgers.length === 0 ? noLedgers : ledgerOptions}
                  </SelectContent>
                </Select>
                <SaveIndicator state={saveStates['ledger-DEFAULT']} />
              </div>
            </CardContent>
          </Card>

          {/* Per productcategorie */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Per productcategorie</CardTitle>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Overschrijf de standaardrekening per categorie.
                </p>
              </div>
              {!addingCategory && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setAddingCategory(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Categorie toevoegen
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryMappings.length === 0 && !addingCategory && (
                <p className="text-muted-foreground text-sm">
                  Geen categoriekoppelingen. Alle regels gebruiken de standaardrekening.
                </p>
              )}

              {categoryMappings.map((m) => {
                const key = `ledger-cat-${m.id}`
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span
                      className="w-36 text-sm font-medium shrink-0 truncate"
                      title={m.sourceId ?? ''}
                    >
                      {m.sourceId ?? '—'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select
                      value={m.externalLedgerId}
                      onValueChange={(id) => {
                        const l = pageData.ledgers.find((x) => x.id === id)
                        if (l) void saveLedgerMapping('PRODUCT_CATEGORY', m.sourceId, l, key)
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageData.ledgers.length === 0 ? noLedgers : ledgerOptions}
                      </SelectContent>
                    </Select>
                    <SaveIndicator state={saveStates[key]} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void deleteLedgerMapping(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Verwijder categorie koppeling</span>
                    </Button>
                  </div>
                )
              })}

              {/* Add-category inline form */}
              {addingCategory && (
                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">Categorienaam</Label>
                      <Input
                        className="h-8 w-40"
                        placeholder="bijv. Advies"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleAddCategory()
                          if (e.key === 'Escape') {
                            setAddingCategory(false)
                            setNewCategoryName('')
                            setNewCategoryLedgerId('')
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mb-2 shrink-0" />
                    <div className="space-y-1">
                      <Label className="text-xs">Grootboekrekening</Label>
                      <Select value={newCategoryLedgerId} onValueChange={setNewCategoryLedgerId}>
                        <SelectTrigger className="h-8 w-64">
                          <SelectValue placeholder="Selecteer…" />
                        </SelectTrigger>
                        <SelectContent>
                          {pageData.ledgers.length === 0 ? noLedgers : ledgerOptions}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleAddCategory()}
                      disabled={
                        !newCategoryName.trim() ||
                        !newCategoryLedgerId ||
                        saveStates['ledger-add-cat'] === 'saving'
                      }
                    >
                      {saveStates['ledger-add-cat'] === 'saving' ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Opslaan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingCategory(false)
                        setNewCategoryName('')
                        setNewCategoryLedgerId('')
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per product */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Per product</CardTitle>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Overschrijf de standaardrekening voor een specifiek product.
                </p>
              </div>
              {!addingProduct && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setAddingProduct(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Product toevoegen
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {productMappings.length === 0 && !addingProduct && (
                <p className="text-muted-foreground text-sm">
                  Geen productkoppelingen. Alle producten gebruiken de standaardrekening.
                </p>
              )}

              {productMappings.map((m) => {
                const key = `ledger-prod-${m.id}`
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span
                      className="w-36 text-sm font-medium shrink-0 truncate"
                      title={m.sourceId ?? ''}
                    >
                      {m.sourceId ?? '—'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select
                      value={m.externalLedgerId}
                      onValueChange={(id) => {
                        const l = pageData.ledgers.find((x) => x.id === id)
                        if (l) void saveLedgerMapping('PRODUCT', m.sourceId, l, key)
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageData.ledgers.length === 0 ? noLedgers : ledgerOptions}
                      </SelectContent>
                    </Select>
                    <SaveIndicator state={saveStates[key]} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void deleteLedgerMapping(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Verwijder productkoppeling</span>
                    </Button>
                  </div>
                )
              })}

              {/* Add-product inline form */}
              {addingProduct && (
                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">Productnaam</Label>
                      <Input
                        className="h-8 w-40"
                        placeholder="bijv. Websitebouw"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleAddProduct()
                          if (e.key === 'Escape') {
                            setAddingProduct(false)
                            setNewProductName('')
                            setNewProductLedgerId('')
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mb-2 shrink-0" />
                    <div className="space-y-1">
                      <Label className="text-xs">Grootboekrekening</Label>
                      <Select value={newProductLedgerId} onValueChange={setNewProductLedgerId}>
                        <SelectTrigger className="h-8 w-64">
                          <SelectValue placeholder="Selecteer…" />
                        </SelectTrigger>
                        <SelectContent>
                          {pageData.ledgers.length === 0 ? noLedgers : ledgerOptions}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleAddProduct()}
                      disabled={
                        !newProductName.trim() ||
                        !newProductLedgerId ||
                        saveStates['ledger-add-prod'] === 'saving'
                      }
                    >
                      {saveStates['ledger-add-prod'] === 'saving' ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Opslaan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingProduct(false)
                        setNewProductName('')
                        setNewProductLedgerId('')
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Preview panel ─────────────────────────────────────── */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Voorbeeld factuurverwerking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Sample invoice line */}
          <div className="rounded-md border bg-background px-4 py-3 text-sm">
            <p className="font-medium">Websitebouw – 10 uur × €95,00 – BTW 21%</p>
          </div>

          <Separator />

          {/* Resolved mappings */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-36 shrink-0 text-xs uppercase tracking-wide">
                Grootboek
              </span>
              {defaultLedger ? (
                <span className="font-medium">
                  {defaultLedger.externalLedgerCode
                    ? `${defaultLedger.externalLedgerCode} – ${defaultLedger.externalLedgerName ?? ''}`
                    : (defaultLedger.externalLedgerName ?? defaultLedger.externalLedgerId)}
                </span>
              ) : (
                <span className="text-muted-foreground italic text-xs">Nog niet ingesteld</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-36 shrink-0 text-xs uppercase tracking-wide">
                BTW-code (21%)
              </span>
              {vatMapping21 ? (
                <span className="font-medium">
                  {vatMapping21.externalVatName ?? vatMapping21.externalVatId}
                </span>
              ) : (
                <span className="text-muted-foreground italic text-xs">Nog niet ingesteld</span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            De preview gebruikt de standaard grootboekrekening en BTW-code voor 21%. Bij
            product- of categoriekoppelingen geldt de meest specifieke koppeling.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
