'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncStatusEntry {
  provider: string
  providerName: string
  externalId: string | null
  externalUrl: string | null
  lastSyncedAt: string | null
  isSynced: boolean
}

interface ConnectionSetting {
  id: string
  provider: string
  providerName: string
  isActive: boolean
}

type SyncState = 'idle' | 'syncing' | 'error'

interface RowData {
  provider: string
  providerName: string
  connectionId: string
  externalId: string | null
  externalUrl: string | null
  lastSyncedAt: string | null
  isSynced: boolean
  syncState: SyncState
  errorMsg: string | null
}

// ─── Provider config ─────────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<string, { accent: string; initials: string }> = {
  MONEYBIRD: { accent: '#1E90FF', initials: 'MB' },
  EXACT:     { accent: '#E8431A', initials: 'EO' },
  TWINFIELD: { accent: '#004B9B', initials: 'TF' },
  SNELSTART: { accent: '#F47920', initials: 'SS' },
}

function providerConfig(provider: string) {
  return PROVIDER_CONFIG[provider] ?? { accent: '#6B7280', initials: provider.slice(0, 2).toUpperCase() }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProviderAvatar({ provider, providerName }: { provider: string; providerName: string }) {
  const cfg = providerConfig(provider)
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ backgroundColor: cfg.accent }}
      title={providerName}
    >
      {cfg.initials}
    </div>
  )
}

function StatusBadge({ row }: { row: RowData }) {
  if (row.syncState === 'syncing') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Bezig…
      </Badge>
    )
  }

  if (row.syncState === 'error') {
    return (
      <Badge variant="destructive" className="gap-1 max-w-[200px] truncate" title={row.errorMsg ?? undefined}>
        <XCircle className="h-3 w-3 shrink-0" />
        {row.errorMsg ?? 'Fout'}
      </Badge>
    )
  }

  if (row.isSynced && row.lastSyncedAt) {
    const relative = formatDistanceToNow(new Date(row.lastSyncedAt), { addSuffix: true, locale: nl })
    return (
      <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50">
        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
        {relative}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Niet gesynchroniseerd
    </Badge>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface InvoiceSyncPanelProps {
  invoiceId: string
}

const POLL_INTERVAL_MS = 5000

export function InvoiceSyncPanel({ invoiceId }: InvoiceSyncPanelProps) {
  const [rows, setRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  // Stable ref so the interval callback always sees latest rows without restart
  const rowsRef = useRef<RowData[]>(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])

  // ── Data fetching ─────────────────────────────────────────────────────────

  async function fetchStatus() {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        fetch(`/api/accounting/sync/status/invoice/${invoiceId}`),
        fetch('/api/accounting/settings'),
      ])

      if (!statusRes.ok || !settingsRes.ok) return

      const statusData: { synced: SyncStatusEntry[] } = await statusRes.json()
      const settingsData: { connections: ConnectionSetting[] } = await settingsRes.json()

      const activeConns = settingsData.connections.filter((c) => c.isActive)

      setRows((prev) => {
        return activeConns.map((conn) => {
          const entry = statusData.synced.find((e) => e.provider === conn.provider)
          const existing = prev.find((r) => r.provider === conn.provider)
          return {
            provider: conn.provider,
            providerName: conn.providerName,
            connectionId: conn.id,
            externalId: entry?.externalId ?? null,
            externalUrl: entry?.externalUrl ?? null,
            lastSyncedAt: entry?.lastSyncedAt ?? null,
            isSynced: entry?.isSynced ?? false,
            // Preserve local sync state (syncing / error) between polls
            syncState: existing?.syncState ?? 'idle',
            errorMsg: existing?.errorMsg ?? null,
          }
        })
      })
    } catch {
      // Silently ignore fetch errors in the poller
    }
  }

  // Initial load
  useEffect(() => {
    let mounted = true
    fetchStatus().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  // Polling: restart when any row is in PENDING state (isSynced === false after a sync was triggered)
  // We keep the interval stable and just read rowsRef.current inside the callback.
  useEffect(() => {
    const id = setInterval(() => {
      const hasPending = rowsRef.current.some((r) => r.syncState === 'syncing')
      if (hasPending) {
        fetchStatus()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  // ── Sync action ───────────────────────────────────────────────────────────

  async function handleSync(provider: string, connectionId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.provider === provider ? { ...r, syncState: 'syncing', errorMsg: null } : r
      )
    )

    try {
      const res = await fetch(`/api/accounting/sync/invoice/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })

      const data: { results?: Array<{ provider: string; status: string; error?: string; externalId?: string }> } = await res.json()

      if (!res.ok) {
        const msg = (data as { error?: string }).error ?? 'Synchronisatie mislukt'
        setRows((prev) =>
          prev.map((r) =>
            r.provider === provider ? { ...r, syncState: 'error', errorMsg: msg } : r
          )
        )
        return
      }

      const result = data.results?.find((r) => r.provider === provider)
      if (result?.status === 'error') {
        setRows((prev) =>
          prev.map((r) =>
            r.provider === provider
              ? { ...r, syncState: 'error', errorMsg: result.error ?? 'Onbekende fout' }
              : r
          )
        )
        return
      }

      // Success — refresh status from server to get externalId/url
      await fetchStatus()
      setRows((prev) =>
        prev.map((r) =>
          r.provider === provider ? { ...r, syncState: 'idle' } : r
        )
      )
    } catch {
      setRows((prev) =>
        prev.map((r) =>
          r.provider === provider
            ? { ...r, syncState: 'error', errorMsg: 'Verbindingsfout' }
            : r
        )
      )
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loading && rows.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">Boekhouding</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Inklappen' : 'Uitklappen'}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 pt-0">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Laden…
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.provider} className="flex items-center gap-3">
                <ProviderAvatar provider={row.provider} providerName={row.providerName} />

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium leading-none">{row.providerName}</span>
                    {row.externalUrl && (
                      <a
                        href={row.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Open in ${row.providerName}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <StatusBadge row={row} />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  disabled={row.syncState === 'syncing'}
                  onClick={() => handleSync(row.provider, row.connectionId)}
                  aria-label={`Synchroniseer met ${row.providerName}`}
                >
                  {row.syncState === 'syncing' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span className="ml-1">Sync</span>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  )
}
