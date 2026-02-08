import { requireSuperuser } from "@/lib/auth/admin-guard"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

export default async function AdminNewsletterPage() {
  await requireSuperuser()

  const [subscribers, stats] = await Promise.all([
    db.newsletterSubscriber.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.newsletterSubscriber.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ])

  const total = subscribers.length
  const confirmed =
    stats.find((s) => s.status === "CONFIRMED")?._count.status || 0
  const pending =
    stats.find((s) => s.status === "PENDING")?._count.status || 0
  const unsubscribed =
    stats.find((s) => s.status === "UNSUBSCRIBED")?._count.status || 0

  function getStatusBadge(status: string) {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Bevestigd
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Wacht op bevestiging
          </Badge>
        )
      case "UNSUBSCRIBED":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3" />
            Uitgeschreven
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nieuwsbrief"
        subtitle="Overzicht van alle nieuwsbrief inschrijvingen"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totaal</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bevestigd</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {confirmed}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wachtend</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uitgeschreven</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">
              {unsubscribed}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inschrijvingen</CardTitle>
          <CardDescription>
            Alle nieuwsbrief abonnees en hun status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nog geen nieuwsbrief inschrijvingen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Ingeschreven</TableHead>
                  <TableHead>Bevestigd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      {sub.user ? (
                        <span className="text-sm">
                          {sub.user.name || sub.user.email}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(sub.createdAt, "dd MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.confirmedAt
                        ? format(sub.confirmedAt, "dd MMM yyyy", {
                            locale: nl,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
