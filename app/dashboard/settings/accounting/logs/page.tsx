'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Minus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import type { SyncLogItem, SyncLogDetail, SyncLogListResponse } from '@/types/accounting'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const REFRESH_INTERVAL_MS = 30_000

const PROVIDER_CONFIG: Record<string, { accent: string; initials: string }> = {
  MONEYBIRD:   { accent: '#1E90FF', initials: 'MB' },
  EBOEKHOUDEN: { accent: '#F28C00', initials: 'EB' },
  EXACT:       { accent: '#D40000', initials: 'EX' },
  YUKI:        { accent: '#6C3483', initials: 'YU' },
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  INVOICE:    'Factuur',
  CUSTOMER:   'Klant',
  CREDIT_NOTE:'Credit nota',
  PAYMENT:    'Betaling',
}

const ENTITY_PATHS: Record<string, string | null> = {
  INVOICE:    '/facturen',
  CUSTOMER:   '/klanten',
  CREDIT_NOTE:'/creditnotas',
  PAYMENT:    null,
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Aangemaakt',
  UPDATE: 'Bijgewerkt',
  DELETE: 'Verwijderd',
}

const ACTION_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(dt: string | Date): string {
  return format(new Date(dt as string), 'dd MMM yyyy HH:mm', { locale: nl })
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function providerCfg(provider: string) {
  return (
    PROVIDER_CONFIG[provider] ?? {
      accent: '#6B7280',
      initials: provider.slice(0, 2).toUpperCase(),
    }
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProviderAvatar({ provider, providerName }: { provider: string; providerName: string }) {
  const cfg = providerCfg(provider)
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: cfg.accent }}
      title={providerName}
    >
      {cfg.initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') {
    return (
      <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Geslaagd
      </Badge>
    )
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Mislukt
      </Badge>
    )
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="secondary" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
        <Clock className="h-3 w-3" />
        In behandeling
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Minus className="h-3 w-3" />
      Overgeslagen
    </Badge>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

// ─── Detail sheet panel ───────────────────────────────────────────────────────

interface DetailPanelProps {
  logId: string | null
  retrying: string | null
  onRetry: (logId: string) => Promise<void>
}

function DetailPanel({ logId, retrying, onRetry }: DetailPanelProps) {
  const [detail, setDetail] = useState<SyncLogDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!logId) return
    // Reset to loading state when logId changes – batched in React 18, safe in an effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetail(null)
    setLoading(true)
    fetch(`/api/accounting/sync/logs/${logId}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .finally(() => setLoading(false))
  }, [logId])

  if (loading || !detail) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    )
  }

  const cfg = providerCfg(detail.provider)
  const entityPath = ENTITY_PATHS[detail.entityType]

  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Overview */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overzicht
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: cfg.accent }}
                >
                  {cfg.initials}
                </span>
                {detail.providerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{ENTITY_TYPE_LABELS[detail.entityType] ?? detail.entityType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entiteit</span>
              {entityPath ? (
                <Link
                  href={`${entityPath}/${detail.entityId}`}
                  className="font-mono text-xs underline underline-offset-2"
                >
                  {detail.entityId.slice(0, 14)}…
                </Link>
              ) : (
                <span className="font-mono text-xs">{detail.entityId.slice(0, 14)}…</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actie</span>
              <span>{ACTION_LABELS[detail.action] ?? detail.action}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={detail.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tijdstip</span>
              <span>{formatTimestamp(detail.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duur</span>
              <span className="font-mono">{formatDuration(detail.durationMs)}</span>
            </div>
            {detail.externalId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extern ID</span>
                <span className="font-mono text-xs">{detail.externalId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error section */}
        {!!(detail.errorMessage || detail.errorDetails) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fout
              </p>
              {detail.errorMessage && (
                <p className="text-sm text-destructive">{detail.errorMessage}</p>
              )}
              {detail.errorCode && (
                <p className="font-mono text-xs text-muted-foreground">
                  Code: {detail.errorCode}
                </p>
              )}
              {!!detail.errorDetails && (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(detail.errorDetails, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

        {/* Request payload */}
        {!!detail.requestPayload && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verzoek
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(detail.requestPayload, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Response payload */}
        {!!detail.responsePayload && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Antwoord
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(detail.responsePayload, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>

      {detail.status === 'FAILED' && (
        <SheetFooter className="border-t p-4">
          <Button
            className="w-full"
            disabled={retrying === logId}
            onClick={() => logId && onRetry(logId)}
          >
            {retrying === logId ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Opnieuw proberen
          </Button>
        </SheetFooter>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SyncLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const provider   = searchParams.get('provider')   ?? ''
  const entityType = searchParams.get('entityType') ?? ''
  const status     = searchParams.get('status')     ?? ''
  const dateFrom   = searchParams.get('dateFrom')   ?? ''
  const dateTo     = searchParams.get('dateTo')     ?? ''
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const [response, setResponse]   = useState<SyncLogListResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [retrying, setRetrying]   = useState<string | null>(null)

  // Keep a stable ref so the auto-refresh interval always calls the latest fetch
  const fetchRef = useRef<() => void>(() => {})

  function buildApiUrl() {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('limit', String(PAGE_SIZE))
    if (provider)   p.set('provider',   provider)
    if (entityType) p.set('entityType', entityType)
    if (status)     p.set('status',     status)
    if (dateFrom)   p.set('dateFrom',   dateFrom)
    if (dateTo)     p.set('dateTo',     dateTo)
    return `/api/accounting/sync/logs?${p.toString()}`
  }

  async function fetchLogs() {
    try {
      const res = await fetch(buildApiUrl())
      if (res.ok) setResponse(await res.json())
    } catch {
      // silently fail on background refresh
    } finally {
      setLoading(false)
    }
  }

  // Always point ref at the latest closure
  fetchRef.current = fetchLogs

  // Re-fetch when any filter or page changes
  useEffect(() => {
    setLoading(true)
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, entityType, status, dateFrom, dateTo, page])

  // Auto-refresh every 30 s while there are PENDING entries
  useEffect(() => {
    const hasPending = response?.logs.some((l) => l.status === 'PENDING')
    if (!hasPending) return
    const id = setInterval(() => fetchRef.current(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [response])

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val)
      else params.delete(key)
    }
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  async function handleRetry(logId: string) {
    setRetrying(logId)
    try {
      const res = await fetch(`/api/accounting/sync/retry/${logId}`, { method: 'POST' })
      if (res.ok) {
        toast.success('Synchronisatie opnieuw gestart')
        setSheetOpen(false)
      } else {
        toast.error('Opnieuw proberen mislukt')
      }
      await fetchLogs()
    } catch {
      toast.error('Verbindingsfout')
    } finally {
      setRetrying(null)
    }
  }

  function openDetail(logId: string) {
    setSelectedId(logId)
    setSheetOpen(true)
  }

  const hasFilters = Boolean(provider || entityType || status || dateFrom || dateTo)
  const logs       = response?.logs ?? []
  const pagination = response?.pagination
  const summary    = response?.summary

  const succeededCount = summary ? summary.total - summary.failed - summary.pending : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings/accounting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sync Log</h2>
          <p className="text-sm text-muted-foreground">
            Overzicht van alle synchronisaties met je boekhoudpakket
          </p>
        </div>
      </div>

      {/* Filter bar — sticky */}
      <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-end gap-3">
          {/* Provider */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Provider</span>
            <Select
              value={provider || '__all__'}
              onValueChange={(v) => updateFilters({ provider: v === '__all__' ? '' : v })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle</SelectItem>
                <SelectItem value="MONEYBIRD">Moneybird</SelectItem>
                <SelectItem value="EBOEKHOUDEN">e-Boekhouden</SelectItem>
                <SelectItem value="EXACT">Exact Online</SelectItem>
                <SelectItem value="YUKI">Yuki</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity type */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Type</span>
            <Select
              value={entityType || '__all__'}
              onValueChange={(v) => updateFilters({ entityType: v === '__all__' ? '' : v })}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle</SelectItem>
                <SelectItem value="CUSTOMER">Klant</SelectItem>
                <SelectItem value="INVOICE">Factuur</SelectItem>
                <SelectItem value="CREDIT_NOTE">Credit nota</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select
              value={status || '__all__'}
              onValueChange={(v) => updateFilters({ status: v === '__all__' ? '' : v })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle</SelectItem>
                <SelectItem value="SUCCESS">Geslaagd</SelectItem>
                <SelectItem value="FAILED">Mislukt</SelectItem>
                <SelectItem value="PENDING">In behandeling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date from */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Van</span>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={dateFrom}
              onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Tot</span>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={dateTo}
              onChange={(e) => updateFilters({ dateTo: e.target.value })}
            />
          </div>

          {/* Reset */}
          {hasFilters && (
            <Link
              href="?"
              className="self-end pb-1 text-sm text-muted-foreground underline hover:text-foreground"
            >
              Filters wissen
            </Link>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {!loading && summary && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="font-medium text-green-700">{succeededCount} geslaagd</span>
          <span className="font-medium text-destructive">{summary.failed} mislukt</span>
          <span className="font-medium text-blue-600">{summary.pending} in behandeling</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : logs.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
          Geen synchronisaties gevonden voor de huidige filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tijdstip</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actie</TableHead>
                <TableHead className="text-right">Duur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 text-center">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: SyncLogItem) => {
                const entityPath = ENTITY_PATHS[log.entityType]
                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(log.id)}
                  >
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatTimestamp(log.createdAt)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProviderAvatar
                          provider={log.provider}
                          providerName={log.providerName}
                        />
                        <span className="text-sm">{log.providerName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {entityPath ? (
                        <Link
                          href={`${entityPath}/${log.entityId}`}
                          className="text-sm hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType}
                        </Link>
                      ) : (
                        <span className="text-sm">
                          {ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={ACTION_VARIANTS[log.action] ?? 'outline'}
                        className="text-xs"
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                      {formatDuration(log.durationMs)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openDetail(log.id)}
                          aria-label="Details bekijken"
                          title="Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {log.status === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            disabled={retrying === log.id}
                            onClick={() => handleRetry(log.id)}
                            aria-label="Opnieuw proberen"
                            title="Opnieuw"
                          >
                            {retrying === log.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > PAGE_SIZE && (
        <Pagination
          totalItems={pagination.total}
          pageSize={PAGE_SIZE}
          currentPage={pagination.page}
        />
      )}

      {/* Detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-lg">
          <SheetHeader className="border-b p-4 pb-3">
            <SheetTitle>Synchronisatie details</SheetTitle>
            <SheetDescription>
              Volledig overzicht van deze synchronisatiepoging
            </SheetDescription>
          </SheetHeader>
          <DetailPanel
            logId={selectedId}
            retrying={retrying}
            onRetry={handleRetry}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
