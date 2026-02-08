import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Plus, Package, TrendingDown, Calculator, Archive } from "lucide-react"

import { getCurrentUser } from "@/lib/get-session"
import { requireFeature } from "@/lib/auth/subscription-guard"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { getAssets, getAssetsSummary } from "./actions"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: "Apparatuur",
  VEHICLE: "Voertuigen",
  FURNITURE: "Inventaris",
  SOFTWARE: "Software",
  BUILDING: "Gebouwen",
  INTANGIBLE: "Immaterieel",
  OTHER: "Overig",
}

export default async function ActivaPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  await requireFeature("tax_reporting")

  const [assets, summary] = await Promise.all([getAssets(), getAssetsSummary()])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bedrijfsmiddelen</h2>
          <p className="text-muted-foreground">
            Beheer je activa en afschrijvingen
          </p>
        </div>
        <Button asChild>
          <Link href="/activa/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw activum
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal activa</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAssets}</div>
            <p className="text-xs text-muted-foreground">actieve bedrijfsmiddelen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aanschafwaarde</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalPurchasePrice)}
            </div>
            <p className="text-xs text-muted-foreground">totale investering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boekwaarde</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalBookValue)}
            </div>
            <p className="text-xs text-muted-foreground">huidige waarde</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afgeschreven</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDepreciation)}
            </div>
            <p className="text-xs text-muted-foreground">cumulatieve afschrijving</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overzicht</CardTitle>
          <CardDescription>
            Alle bedrijfsmiddelen met hun boekwaarde
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Geen bedrijfsmiddelen</h3>
              <p className="text-muted-foreground mb-4">
                Voeg je eerste activum toe om afschrijvingen bij te houden
              </p>
              <Button asChild>
                <Link href="/activa/nieuw">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuw activum
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Aankoopdatum</TableHead>
                  <TableHead className="text-right">Aanschafprijs</TableHead>
                  <TableHead className="text-right">Boekwaarde</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link
                        href={`/activa/${asset.id}`}
                        className="font-medium hover:underline"
                      >
                        {asset.name}
                      </Link>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {asset.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(asset.purchaseDate), "d MMM yyyy", {
                        locale: nl,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.bookValue)}
                    </TableCell>
                    <TableCell>
                      {asset.isActive ? (
                        <Badge variant="default">Actief</Badge>
                      ) : (
                        <Badge variant="secondary">Verkocht</Badge>
                      )}
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
