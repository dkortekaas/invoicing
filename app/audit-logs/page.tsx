import { AuditLogViewer } from "@/components/audit/audit-log-viewer"
import { AuditAlerts } from "@/components/audit/audit-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertTriangle } from "lucide-react"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { T } from "@/components/t"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  await requireAdmin()

  const activeTab = searchParams.tab || "logs"

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <T ns="auditLogsPage" k="title" />
        </h1>
        <p className="text-muted-foreground mt-2">
          <T ns="auditLogsPage" k="description" />
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            <T ns="auditLogsPage" k="tabAllActivities" />
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <T ns="auditLogsPage" k="tabSuspicious" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <AuditLogViewer showFilters={true} limit={50} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <T ns="auditLogsPage" k="alertsTitle" />
              </CardTitle>
              <CardDescription>
                <T ns="auditLogsPage" k="alertsDescription" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditAlerts days={30} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
