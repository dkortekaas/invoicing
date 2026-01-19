"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Alert {
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
  suspiciousReason: string | null
  ipAddress: string | null
}

export function AuditAlerts({ days = 7 }: { days?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<{
    total: number
    byReason: Array<{ reason: string; count: number }>
  } | null>(null)

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/audit-logs/alerts?days=${days}&limit=50`)
      const data = await response.json()
      setAlerts(data.alerts || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [days])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Verdachte Activiteiten
          </CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Verdachte Activiteiten
            </CardTitle>
            <CardDescription>
              Laatste {days} dagen • {alerts.length} waarschuwingen
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Vernieuwen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary && summary.byReason.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-sm font-medium">Samenvatting:</div>
            {summary.byReason.map((item) => (
              <div
                key={item.reason}
                className="flex items-center justify-between rounded-md bg-red-50 p-2 text-sm"
              >
                <span className="text-red-800">{item.reason}</span>
                <Badge variant="destructive">{item.count}</Badge>
              </div>
            ))}
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Geen verdachte activiteiten gevonden
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive" className="text-xs">
                        {alert.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {alert.entityType}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-red-800">
                      {alert.suspiciousReason}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {alert.userEmail}
                      {alert.ipAddress && ` • ${alert.ipAddress}`}
                      {" • "}
                      {format(new Date(alert.timestamp), "dd MMM yyyy HH:mm", {
                        locale: nl,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
