"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Activity } from "lucide-react"
import Link from "next/link"

interface AuditLog {
  id: string
  timestamp: string
  userEmail: string
  action: string
  entityType: string
  entityId: string | null
  isSuspicious: boolean
}

export function RecentActivity({ limit = 10 }: { limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsResponse, alertsResponse] = await Promise.all([
          fetch(`/api/audit-logs?limit=${limit}`),
          fetch("/api/audit-logs/alerts?days=7&limit=10"),
        ])

        const logsData = await logsResponse.json()
        const alertsData = await alertsResponse.json()

        setLogs(logsData.logs || [])
        setAlertsCount(alertsData.alerts?.length || 0)
      } catch (error) {
        console.error("Error fetching recent activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [limit])

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Aangemaakt",
      UPDATE: "Bijgewerkt",
      DELETE: "Verwijderd",
      VIEW: "Bekeken",
      EXPORT: "Geëxporteerd",
      LOGIN: "Ingelogd",
      LOGOUT: "Uitgelogd",
      LOGIN_FAILED: "Login mislukt",
      PAYMENT_RECORDED: "Betaling geregistreerd",
      INVOICE_SENT: "Factuur verzonden",
    }
    return labels[action] || action
  }

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      invoice: "Factuur",
      customer: "Klant",
      product: "Product",
      settings: "Instellingen",
      user: "Gebruiker",
    }
    return labels[entityType] || entityType
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recente Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recente Activiteit
          </CardTitle>
          {alertsCount > 0 && (
            <Link href="/audit-logs?tab=alerts">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {alertsCount} waarschuwingen
              </Badge>
            </Link>
          )}
        </div>
        <CardDescription>
          Laatste {limit} activiteiten in het systeem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Geen recente activiteit
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getActionLabel(log.action)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getEntityLabel(log.entityType)}
                    </span>
                    {log.isSuspicious && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {log.userEmail} •{" "}
                    {format(new Date(log.timestamp), "dd MMM yyyy HH:mm", {
                      locale: nl,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            href="/audit-logs"
            className="text-sm text-primary hover:underline"
          >
            Bekijk volledige audit log →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
