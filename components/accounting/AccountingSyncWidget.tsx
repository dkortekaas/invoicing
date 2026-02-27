'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  Cloud,
  Loader2,
  RefreshCw,
  Settings,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { BulkSyncModal, type InvoiceInput } from '@/components/accounting/BulkSyncModal'
import type { SyncLogItem } from '@/types/accounting'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionStatus {
  provider: string
  providerName: string
  isActive: boolean
  lastError: string | null
  lastSyncAt: string | null
}

interface UnsyncedData {
  count: number
  invoices: InvoiceInput[]
}

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

const ENTITY_TYPE_LABELS: Record<string, string> = {
  INVOICE:    'Factuur',
  CUSTOMER:   'Klant',
  CREDIT_NOTE:'Credit nota',
  PAYMENT:    'Betaling',
}

const REFRESH_INTERVAL_MS = 60_000

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

// ─── Widget ───────────────────────────────────────────────────────────────────

export function AccountingSyncWidget() {
  const [connections, setConnections]   = useState<ConnectionStatus[]>([])
  const [recentErrors, setRecentErrors] = useState<SyncLogItem[]>([])
  const [unsynced, setUnsynced]         = useState<UnsyncedData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [bulkSyncOpen, setBulkSyncOpen] = useState(false)

  // Stable ref so the interval always calls the latest fetch closure
  const fetchRef = useRef<() => void>(() => {})

  async function fetchData() {
    try {
      const [connRes, errRes, unsyncedRes] = await Promise.all([
        fetch('/api/accounting/status'),
        fetch('/api/accounting/sync/logs?status=FAILED&limit=3'),
        fetch('/api/accounting/sync/unsynced-count'),
      ])

      const [connData, errData, unsyncedData] = await Promise.all([
        connRes.json(),
        errRes.json(),
        unsyncedRes.json(),
      ])

      if (Array.isArray(connData)) {
        setConnections((connData as ConnectionStatus[]).filter((c) => c.isActive))
      }
      if (Array.isArray(errData?.logs)) {
        setRecentErrors(errData.logs as SyncLogItem[])
      }
      if (typeof unsyncedData?.count === 'number') {
        setUnsynced(unsyncedData as UnsyncedData)
      }
    } catch {
      // silently fail; stale data remains visible
    } finally {
      setLoading(false)
    }
  }

  fetchRef.current = fetchData

  useEffect(() => {
    fetchData()
    const id = setInterval(() => fetchRef.current(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeConnections   = connections.filter((c) => c.isActive)
  const unhealthyCount      = activeConnections.filter((c) => c.lastError).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Cloud className="h-4 w-4" />
            Boekhouding
          </CardTitle>
          <Link
            href="/dashboard/settings/accounting"
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            title="Boekhoudkoppelingen"
            aria-label="Boekhoudkoppelingen beheren"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col space-y-3 overflow-hidden">
          {/* ── Loading skeleton ────────────────────────────────────────── */}
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          )}

          {/* ── No active connections ────────────────────────────────────── */}
          {!loading && activeConnections.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
              <Cloud className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">Geen koppeling actief</p>
                <p className="text-xs text-muted-foreground">
                  Koppel je boekhoudpakket om facturen automatisch te synchroniseren.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/settings/accounting">Verbinden</Link>
              </Button>
            </div>
          )}

          {/* ── Active connections view ──────────────────────────────────── */}
          {!loading && activeConnections.length > 0 && (
            <>
              {/* Unsynced count stat */}
              {unsynced !== null && (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-sm">
                    <span
                      className={
                        unsynced.count > 0
                          ? 'font-semibold text-amber-700'
                          : 'font-medium text-muted-foreground'
                      }
                    >
                      {unsynced.count}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}factuur{unsynced.count !== 1 ? 'en' : ''} niet gesynchroniseerd
                    </span>
                  </span>
                  {unsynced.count > 0 && (
                    <button
                      className="ml-2 flex shrink-0 items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setBulkSyncOpen(true)}
                      title="Synchroniseer niet-gesyncte facturen"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Sync
                    </button>
                  )}
                </div>
              )}

              {/* Per-connection health rows */}
              <div className="space-y-1.5">
                {activeConnections.map((conn) => (
                  <div key={conn.provider} className="flex items-center gap-2">
                    <ProviderBubble
                      provider={conn.provider}
                      providerName={conn.providerName}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {conn.providerName}
                    </span>
                    {conn.lastError ? (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-red-500"
                        title={conn.lastError}
                      />
                    ) : (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-green-500"
                        title="Actief"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Recent errors */}
              {recentErrors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Recente fouten</p>
                      <Link
                        href="/dashboard/settings/accounting/logs?status=FAILED"
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Bekijk log
                      </Link>
                    </div>

                    {/* Scrollable error list — capped at ~120px */}
                    <div className="max-h-[120px] space-y-0.5 overflow-y-auto">
                      {recentErrors.map((err) => (
                        <div
                          key={err.id}
                          className="flex items-start gap-1.5 rounded-sm px-1 py-1 text-xs hover:bg-muted/40"
                        >
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-medium">
                                {ENTITY_TYPE_LABELS[err.entityType as string] ?? err.entityType}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(err.createdAt as unknown as string),
                                  { addSuffix: true, locale: nl },
                                )}
                              </span>
                            </div>
                            {err.errorMessage && (
                              <p className="truncate text-muted-foreground">
                                {err.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Quick action button */}
              {unsynced !== null && unsynced.count > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto w-full"
                  onClick={() => setBulkSyncOpen(true)}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Sync niet-gesyncte facturen
                </Button>
              )}

              {/* Healthy state — no errors, nothing to sync */}
              {recentErrors.length === 0 &&
                unsynced !== null &&
                unsynced.count === 0 &&
                unhealthyCount === 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Alles up-to-date ✓
                  </p>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* BulkSyncModal */}
      {bulkSyncOpen && unsynced && (
        <BulkSyncModal
          invoices={unsynced.invoices}
          onClose={() => setBulkSyncOpen(false)}
          onComplete={() => {
            setBulkSyncOpen(false)
            // Refresh widget data after sync completes
            fetchRef.current()
          }}
        />
      )}
    </>
  )
}
