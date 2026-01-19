"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
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
import { AlertTriangle, Download, RefreshCw } from "lucide-react"
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
  changes: any
  metadata: any
  ipAddress: string | null
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
  const [filters, setFilters] = useState({
    action: "",
    startDate: "",
    endDate: "",
  })

  const fetchLogs = async () => {
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
        if (filters.action) params.append("action", filters.action)
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
  }

  useEffect(() => {
    fetchLogs()
  }, [page, filters, entityType, entityId, userId])

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
        <div className="flex items-center justify-between">
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
                <SelectItem value="">Alle acties</SelectItem>
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
                {logs.map((log) => (
                  <TableRow key={log.id}>
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
                      {log.isSuspicious && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Verdacht
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
    </Card>
  )
}
