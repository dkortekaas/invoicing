'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  Minus,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { BulkSyncResult, BulkSyncItemResult } from '@/types/accounting'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Connection {
  id: string
  provider: string
  providerName: string
  isActive: boolean
}

export interface InvoiceInput {
  id: string
  invoiceNumber: string
  /** InvoiceStatus string — used to detect DRAFT */
  status: string
}

type InvoiceRowStatus = 'waiting' | 'syncing' | 'success' | 'error' | 'skipped'

interface InvoiceRowState {
  id: string
  invoiceNumber: string
  rowStatus: InvoiceRowStatus
  providerResults: Array<{
    provider: string
    providerName: string
    status: string
    error?: string | null
  }>
}

type Step = 'confirm' | 'syncing' | 'result'

// Matches the API's SYNC_THRESHOLD
const SMALL_BATCH_THRESHOLD = 10

// ─── Provider display helpers ─────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  MONEYBIRD:   '#1E90FF',
  EBOEKHOUDEN: '#F28C00',
  EXACT:       '#D40000',
  YUKI:        '#6C3483',
}

const PROVIDER_INITIALS: Record<string, string> = {
  MONEYBIRD:   'MB',
  EBOEKHOUDEN: 'EB',
  EXACT:       'EX',
  YUKI:        'YU',
}

function ProviderBubble({ provider, providerName }: { provider: string; providerName: string }) {
  const color    = PROVIDER_COLORS[provider]    ?? '#6B7280'
  const initials = PROVIDER_INITIALS[provider] ?? provider.slice(0, 2).toUpperCase()
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: color }}
      title={providerName}
    >
      {initials}
    </span>
  )
}

// ─── BulkSyncModal ────────────────────────────────────────────────────────────

interface BulkSyncModalProps {
  invoices: InvoiceInput[]
  onClose: () => void
  onComplete: (results: BulkSyncResult) => void
}

export function BulkSyncModal({ invoices, onClose, onComplete }: BulkSyncModalProps) {
  // ── Step & connection state ────────────────────────────────────────────────
  const [step, setStep]                           = useState<Step>('confirm')
  const [connections, setConnections]             = useState<Connection[]>([])
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set())
  const [loadingConnections, setLoadingConnections] = useState(true)

  // ── Sync progress state ────────────────────────────────────────────────────
  const [invoiceStates, setInvoiceStates] = useState<Map<string, InvoiceRowState>>(new Map())
  const [syncedCount, setSyncedCount]     = useState(0)
  const [isLargeBatch, setIsLargeBatch]   = useState(false)

  // ── Result state ───────────────────────────────────────────────────────────
  const [result, setResult]   = useState<BulkSyncResult | null>(null)
  const [retrying, setRetrying] = useState<Set<string>>(new Set())

  const abortRef = useRef(false)

  // ── Load active connections on mount ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/accounting/status')
      .then((r) => r.json())
      .then((data: Connection[]) => {
        const active = (Array.isArray(data) ? data : []).filter((c) => c.isActive)
        setConnections(active)
        setSelectedIds(new Set(active.map((c) => c.id)))
      })
      .catch(() => {})
      .finally(() => setLoadingConnections(false))
  }, [])

  // ── Derived counts ─────────────────────────────────────────────────────────
  const draftCount     = invoices.filter((i) => i.status === 'DRAFT').length
  const syncableInvoices = invoices.filter((i) => i.status !== 'DRAFT')

  // ── Provider checkbox toggle (keep at least 1 selected) ───────────────────
  function toggleConnection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ── Invoice state helpers ──────────────────────────────────────────────────
  function buildInitialStates(): Map<string, InvoiceRowState> {
    const map = new Map<string, InvoiceRowState>()
    for (const inv of invoices) {
      map.set(inv.id, {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        rowStatus: inv.status === 'DRAFT' ? 'skipped' : 'waiting',
        providerResults: [],
      })
    }
    return map
  }

  function patchInvoiceState(id: string, patch: Partial<InvoiceRowState>) {
    setInvoiceStates((prev) => {
      const next = new Map(prev)
      const cur  = next.get(id)
      if (cur) next.set(id, { ...cur, ...patch })
      return next
    })
  }

  // ── Call the single-invoice sync endpoint ──────────────────────────────────
  async function syncOneInvoice(
    invoiceId: string,
    connectionId?: string,
  ): Promise<Array<{ provider: string; providerName: string; status: string; externalId?: string; error?: string }>> {
    const res = await fetch(`/api/accounting/sync/invoice/${invoiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connectionId ? { connectionId } : {}),
    })
    const data = await res.json() as { results?: Array<{ provider: string; providerName: string; status: string; externalId?: string; error?: string }> }
    return data.results ?? []
  }

  // ── Start sync ─────────────────────────────────────────────────────────────
  async function handleStart() {
    abortRef.current = false
    setInvoiceStates(buildInitialStates())
    setSyncedCount(0)
    setStep('syncing')

    const selectedConnections = connections.filter((c) => selectedIds.has(c.id))

    // Edge case: all selected invoices are drafts
    if (syncableInvoices.length === 0) {
      const r: BulkSyncResult = { succeeded: 0, failed: 0, skipped: draftCount, results: [] }
      setResult(r)
      setStep('result')
      onComplete(r)
      return
    }

    // ── Large batch path ───────────────────────────────────────────────────
    if (syncableInvoices.length > SMALL_BATCH_THRESHOLD) {
      setIsLargeBatch(true)
      const invoiceIds = syncableInvoices.map((i) => i.id)

      try {
        // If all connections are selected (or only 1 exists), one call without connectionId
        // syncs to all active connections. Otherwise, one call per selected connection.
        const callAll = selectedConnections.length === connections.length
        if (callAll) {
          await fetch('/api/accounting/sync/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceIds }),
          })
        } else {
          for (const conn of selectedConnections) {
            await fetch('/api/accounting/sync/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invoiceIds, connectionId: conn.id }),
            })
          }
        }
      } catch {
        toast.error('Verbindingsfout bij synchronisatie')
      }

      const r: BulkSyncResult = { succeeded: 0, failed: 0, skipped: draftCount, results: [] }
      setResult(r)
      setStep('result')
      onComplete(r)
      return
    }

    // ── Small batch path: sequential per-invoice sync ──────────────────────
    const allResults: BulkSyncItemResult[] = []

    for (const invoice of syncableInvoices) {
      if (abortRef.current) break

      patchInvoiceState(invoice.id, { rowStatus: 'syncing' })

      const rowProviderResults: InvoiceRowState['providerResults'] = []
      let hasError = false

      try {
        const callAll = selectedConnections.length === connections.length
        const apiResults = callAll
          ? await syncOneInvoice(invoice.id)
          : (
              await Promise.all(
                selectedConnections.map((c) => syncOneInvoice(invoice.id, c.id))
              )
            ).flat()

        for (const r of apiResults) {
          rowProviderResults.push({
            provider: r.provider,
            providerName: r.providerName,
            status: r.status,
            error: r.error,
          })
          allResults.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            provider: r.provider,
            providerName: r.providerName,
            status: r.status as BulkSyncItemResult['status'],
            error: r.error,
          })
          if (r.status === 'error') hasError = true
        }
      } catch {
        hasError = true
        for (const conn of selectedConnections) {
          rowProviderResults.push({
            provider: conn.provider,
            providerName: conn.providerName,
            status: 'error',
            error: 'Verbindingsfout',
          })
          allResults.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            provider: conn.provider,
            providerName: conn.providerName,
            status: 'error',
            error: 'Verbindingsfout',
          })
        }
      }

      patchInvoiceState(invoice.id, {
        rowStatus: hasError ? 'error' : 'success',
        providerResults: rowProviderResults,
      })
      setSyncedCount((c) => c + 1)
    }

    // Mark draft invoices as skipped in results
    for (const inv of invoices.filter((i) => i.status === 'DRAFT')) {
      for (const conn of selectedConnections) {
        allResults.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          provider: conn.provider,
          providerName: conn.providerName,
          status: 'skipped',
        })
      }
    }

    const r: BulkSyncResult = {
      succeeded: allResults.filter((x) => x.status === 'success').length,
      failed:    allResults.filter((x) => x.status === 'error').length,
      skipped:   allResults.filter((x) => x.status === 'skipped').length,
      results:   allResults,
    }
    setResult(r)
    setStep('result')
    onComplete(r)
  }

  // ── Retry a single failed item ─────────────────────────────────────────────
  async function handleRetry(item: BulkSyncItemResult, connectionId: string) {
    const key = `${item.invoiceId}:${connectionId}`
    setRetrying((prev) => new Set(prev).add(key))
    try {
      const res = await fetch(`/api/accounting/sync/invoice/${item.invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      if (res.ok) {
        toast.success(`${item.invoiceNumber} opnieuw gesynchroniseerd naar ${item.providerName}`)
        // Update result list optimistically
        setResult((prev) =>
          prev
            ? {
                ...prev,
                succeeded: prev.succeeded + 1,
                failed:    prev.failed - 1,
                results:   prev.results.map((r) =>
                  r.invoiceId === item.invoiceId && r.provider === item.provider
                    ? { ...r, status: 'success', error: null }
                    : r,
                ),
              }
            : prev,
        )
      } else {
        toast.error(`Opnieuw proberen mislukt voor ${item.invoiceNumber}`)
      }
    } catch {
      toast.error('Verbindingsfout')
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // ── Computed values ────────────────────────────────────────────────────────
  const progressPct = syncableInvoices.length > 0
    ? Math.round((syncedCount / syncableInvoices.length) * 100)
    : 0

  const isSyncing = step === 'syncing'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open
      onOpenChange={(open) => { if (!open && !isSyncing) onClose() }}
    >
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!isSyncing}
        onInteractOutside={(e) => { if (isSyncing) e.preventDefault() }}
        onEscapeKeyDown={(e)    => { if (isSyncing) e.preventDefault() }}
      >

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1 — Bevestigen
        ════════════════════════════════════════════════════════════════ */}
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>
                Synchroniseer {invoices.length}{' '}
                {invoices.length === 1 ? 'factuur' : 'facturen'}
              </DialogTitle>
              <DialogDescription>
                De geselecteerde facturen worden gesynchroniseerd naar je boekhoudpakket.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Warnings */}
              <div className="space-y-2">
                {draftCount > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>{draftCount}</strong>{' '}
                      conceptfactuur{draftCount !== 1 ? 'en worden overgeslagen' : ' wordt overgeslagen'}.
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span>
                    Klanten die nog niet gesynchroniseerd zijn worden automatisch eerst aangemaakt.
                  </span>
                </div>

                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span>
                    Facturen die al gesynchroniseerd zijn worden bijgewerkt in plaats van opnieuw aangemaakt.
                  </span>
                </div>
              </div>

              <Separator />

              {/* Provider selection */}
              {loadingConnections ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Koppelingen laden…
                </div>
              ) : connections.length === 0 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Geen actieve boekhoudkoppelingen gevonden. Configureer een koppeling via{' '}
                  <Link
                    href="/dashboard/settings/accounting"
                    className="underline"
                  >
                    Instellingen
                  </Link>
                  .
                </div>
              ) : connections.length === 1 ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Synchroniseer naar</span>
                  <ProviderBubble
                    provider={connections[0]!.provider}
                    providerName={connections[0]!.providerName}
                  />
                  <span className="font-medium">{connections[0]!.providerName}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Synchroniseer naar</p>
                  {connections.map((conn) => (
                    <label
                      key={conn.id}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <Checkbox
                        checked={selectedIds.has(conn.id)}
                        onCheckedChange={() => toggleConnection(conn.id)}
                      />
                      <ProviderBubble
                        provider={conn.provider}
                        providerName={conn.providerName}
                      />
                      <span className="text-sm">{conn.providerName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button
                onClick={handleStart}
                disabled={
                  loadingConnections ||
                  connections.length === 0 ||
                  selectedIds.size === 0
                }
              >
                Starten
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2 — Voortgang
        ════════════════════════════════════════════════════════════════ */}
        {step === 'syncing' && (
          <>
            <DialogHeader>
              <DialogTitle>Bezig met synchroniseren…</DialogTitle>
              <DialogDescription>
                {isLargeBatch
                  ? 'Grote batch wordt op de achtergrond verwerkt.'
                  : `${syncedCount} van de ${syncableInvoices.length} facturen verwerkt`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Progress value={isLargeBatch ? 60 : progressPct} />

              {/* Per-invoice status list (small batch only) */}
              {!isLargeBatch && (
                <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-md border bg-muted/30 p-2">
                  {Array.from(invoiceStates.values()).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                    >
                      {inv.rowStatus === 'waiting'  && <Clock       className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {inv.rowStatus === 'syncing'  && <Loader2     className="h-4 w-4 shrink-0 animate-spin text-blue-500" />}
                      {inv.rowStatus === 'success'  && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                      {inv.rowStatus === 'error'    && <XCircle     className="h-4 w-4 shrink-0 text-destructive" />}
                      {inv.rowStatus === 'skipped'  && <Minus       className="h-4 w-4 shrink-0 text-muted-foreground" />}

                      <span
                        className={
                          inv.rowStatus === 'skipped'
                            ? 'text-muted-foreground'
                            : 'font-medium'
                        }
                      >
                        {inv.invoiceNumber}
                      </span>

                      {inv.rowStatus === 'success' && inv.providerResults.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {inv.providerResults.map((r) => r.providerName).join(', ')}
                        </span>
                      )}

                      {inv.rowStatus === 'error' && (
                        <span className="ml-auto truncate text-xs text-destructive">
                          {inv.providerResults
                            .filter((r) => r.status === 'error')
                            .map((r) => r.error ?? 'Fout')
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" disabled>
                Sluiten
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3 — Resultaat
        ════════════════════════════════════════════════════════════════ */}
        {step === 'result' && result && (
          <>
            <DialogHeader>
              <DialogTitle>Synchronisatie voltooid</DialogTitle>
              <DialogDescription>
                {isLargeBatch
                  ? `${syncableInvoices.length} facturen worden op de achtergrond verwerkt.`
                  : [
                      result.succeeded > 0 && `${result.succeeded} geslaagd`,
                      result.failed    > 0 && `${result.failed} mislukt`,
                      result.skipped   > 0 && `${result.skipped} overgeslagen`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
              </DialogDescription>
            </DialogHeader>

            {!isLargeBatch && (
              <div className="space-y-4">
                {/* Summary badges */}
                <div className="flex flex-wrap gap-2">
                  {result.succeeded > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-green-300 bg-green-50 text-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {result.succeeded} geslaagd
                    </Badge>
                  )}
                  {result.failed > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {result.failed} mislukt
                    </Badge>
                  )}
                  {result.skipped > 0 && (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <Minus className="h-3 w-3" />
                      {result.skipped} overgeslagen
                    </Badge>
                  )}
                </div>

                {/* Failed items with retry */}
                {result.failed > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Mislukte synchronisaties</p>
                    <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-2">
                      {result.results
                        .filter((r) => r.status === 'error')
                        .map((r, idx) => {
                          const conn = connections.find((c) => c.provider === r.provider)
                          const retryKey = `${r.invoiceId}:${conn?.id ?? r.provider}`
                          const isRetrying = retrying.has(retryKey)
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                            >
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                              <span className="font-medium">{r.invoiceNumber}</span>
                              <ProviderBubble
                                provider={r.provider}
                                providerName={r.providerName}
                              />
                              {r.error && (
                                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                                  {r.error}
                                </span>
                              )}
                              {conn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-7 shrink-0 gap-1 px-2"
                                  disabled={isRetrying}
                                  onClick={() => handleRetry(r, conn.id)}
                                >
                                  {isRetrying ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <RefreshCw className="h-3 w-3" />
                                      Opnieuw
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="sm:items-center sm:justify-between">
              <Link
                href="/dashboard/settings/accounting/logs"
                className="flex items-center gap-1 text-sm text-muted-foreground underline hover:text-foreground"
              >
                Bekijk sync log
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Button onClick={onClose}>Sluiten</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
