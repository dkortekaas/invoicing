"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Prisma } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Download, RefreshCw, Eye, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AuditLog {
  id: string
  timestamp: string
  userEmail: string
  user?: {
    name: string | null
    email: string
  }
  action: string
  entityType: string
  entityId: string | null
  changes: Prisma.JsonValue | null
  metadata: Prisma.JsonValue | null
  ipAddress: string | null
  userAgent: string | null
  isSuspicious: boolean
  suspiciousReason: string | null
}

interface AuditLogViewerProps {
  entityType?: string
  entityId?: string
  userId?: string
  showFilters?: boolean
  limit?: number
}

export function AuditLogViewer({
  entityType,
  entityId,
  userId,
  showFilters = true,
  limit = 50,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    action: "ALL",
    startDate: "",
    endDate: "",
  })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (entityType && entityId) {
        // Fetch entity-specific logs
        const response = await fetch(`/api/audit-logs/entity/${entityType}/${entityId}`)
        const data = await response.json()
        setLogs(data.logs || [])
      } else if (userId) {
        // Fetch user-specific logs
        params.append("userId", userId)
        const response = await fetch(`/api/audit-logs/user/${userId}?${params}`)
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        // Fetch all logs
        if (filters.action && filters.action !== "ALL") params.append("action", filters.action)
        if (filters.startDate) params.append("startDate", filters.startDate)
        if (filters.endDate) params.append("endDate", filters.endDate)

        const response = await fetch(`/api/audit-logs?${params}`)
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters, entityType, entityId, userId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/audit-logs/export?format=csv&${params}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting audit logs:", error)
    }
  }

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800"
      case "UPDATE":
        return "bg-blue-100 text-blue-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      case "VIEW":
        return "bg-gray-100 text-gray-800"
      case "EXPORT":
        return "bg-purple-100 text-purple-800"
      case "LOGIN":
        return "bg-emerald-100 text-emerald-800"
      case "LOGOUT":
        return "bg-amber-100 text-amber-800"
      case "LOGIN_FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatChanges = (changes: Prisma.JsonValue | null) => {
    if (!changes || typeof changes !== "object") return null
    
    return Object.entries(changes as Record<string, { oldValue: unknown; newValue: unknown }>).map(([key, value]) => (
      <div key={key} className="border-l-2 border-blue-200 pl-3 py-1">
        <div className="font-medium text-sm">{key}</div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            <span className="text-red-600">Oud: </span>
            <span className="font-mono">
              {value.oldValue === null
                ? "null"
                : typeof value.oldValue === "object"
                ? JSON.stringify(value.oldValue, null, 2)
                : String(value.oldValue)}
            </span>
          </div>
          <div>
            <span className="text-green-600">Nieuw: </span>
            <span className="font-mono">
              {value.newValue === null
                ? "null"
                : typeof value.newValue === "object"
                ? JSON.stringify(value.newValue, null, 2)
                : String(value.newValue)}
            </span>
          </div>
        </div>
      </div>
    ))
  }

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Activiteiten geschiedenis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Activiteiten geschiedenis</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Vernieuwen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && !entityType && (
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Select
              value={filters.action}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle acties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle acties</SelectItem>
                <SelectItem value="CREATE">Aanmaken</SelectItem>
                <SelectItem value="UPDATE">Bijwerken</SelectItem>
                <SelectItem value="DELETE">Verwijderen</SelectItem>
                <SelectItem value="VIEW">Bekijken</SelectItem>
                <SelectItem value="EXPORT">Exporteren</SelectItem>
                <SelectItem value="LOGIN">Inloggen</SelectItem>
                <SelectItem value="LOGOUT">Uitloggen</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Van datum"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
            <Input
              type="date"
              placeholder="Tot datum"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>
        )}

        {logs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Geen audit logs gevonden
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum/Tijd</TableHead>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Actie</TableHead>
                  <TableHead>Entiteit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedRows.has(log.id)
                  const hasChanges = log.changes && Object.keys(log.changes).length > 0
                  
                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(log.id)}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.timestamp), "dd-MM-yyyy HH:mm:ss", {
                            locale: nl,
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.user?.name || log.userEmail}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.userEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-xs text-muted-foreground">
                                {log.entityId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.isSuspicious && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Verdacht
                              </Badge>
                            )}
                            {hasChanges && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleRow(log.id)
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(log)
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasChanges && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="py-3 space-y-2">
                              <div className="text-sm font-medium mb-2">Wijzigingen:</div>
                              <div className="space-y-2">{formatChanges(log.changes)}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Pagina {page} van {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Vorige
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Volledige details van deze audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Datum/Tijd</div>
                  <div className="font-mono text-sm">
                    {format(new Date(selectedLog.timestamp), "dd-MM-yyyy HH:mm:ss", {
                      locale: nl,
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Actie</div>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Gebruiker</div>
                  <div>
                    <div className="font-medium">
                      {selectedLog.user?.name || selectedLog.userEmail}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedLog.userEmail}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Entiteit</div>
                  <div>
                    <div className="font-medium">{selectedLog.entityType}</div>
                    {selectedLog.entityId && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {selectedLog.entityId}
                      </div>
                    )}
                  </div>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">IP Adres</div>
                    <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">User Agent</div>
                    <div className="text-xs break-all">{selectedLog.userAgent}</div>
                  </div>
                )}
                {selectedLog.isSuspicious && (
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Verdacht Reden</div>
                    <div className="text-sm text-red-600">{selectedLog.suspiciousReason}</div>
                  </div>
                )}
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Wijzigingen
                  </div>
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    {formatChanges(selectedLog.changes)}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Metadata
                  </div>
                  <pre className="border rounded-lg p-4 bg-muted/30 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
