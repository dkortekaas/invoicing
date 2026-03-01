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
import { T } from "@/components/t"

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
          <h2 className="text-2xl font-bold tracking-tight"><T ns="assetsPage" k="title" /></h2>
          <p className="text-muted-foreground">
            <T ns="assetsPage" k="description" />
          </p>
        </div>
        <Button asChild>
          <Link href="/activa/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            <T ns="assetsPage" k="newAsset" />
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><T ns="assetsPage" k="totalAssets" /></CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAssets}</div>
            <p className="text-xs text-muted-foreground"><T ns="assetsPage" k="totalAssetsDescription" /></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><T ns="assetsPage" k="purchasePrice" /></CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalPurchasePrice)}
            </div>
            <p className="text-xs text-muted-foreground"><T ns="assetsPage" k="purchasePriceDescription" /></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><T ns="assetsPage" k="bookValue" /></CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalBookValue)}
            </div>
            <p className="text-xs text-muted-foreground"><T ns="assetsPage" k="bookValueDescription" /></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><T ns="assetsPage" k="depreciated" /></CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDepreciation)}
            </div>
            <p className="text-xs text-muted-foreground"><T ns="assetsPage" k="depreciatedDescription" /></p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle><T ns="assetsPage" k="overview" /></CardTitle>
          <CardDescription>
            <T ns="assetsPage" k="overviewDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold"><T ns="assetsPage" k="noAssets" /></h3>
              <p className="text-muted-foreground mb-4">
                <T ns="assetsPage" k="noAssetsDescription" />
              </p>
              <Button asChild>
                <Link href="/activa/nieuw">
                  <Plus className="mr-2 h-4 w-4" />
                  <T ns="assetsPage" k="newAsset" />
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><T ns="assetsPage" k="colName" /></TableHead>
                  <TableHead><T ns="assetsPage" k="colCategory" /></TableHead>
                  <TableHead><T ns="assetsPage" k="colPurchaseDate" /></TableHead>
                  <TableHead className="text-right"><T ns="assetsPage" k="colPurchasePrice" /></TableHead>
                  <TableHead className="text-right"><T ns="assetsPage" k="colBookValue" /></TableHead>
                  <TableHead><T ns="assetsPage" k="colStatus" /></TableHead>
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
                        <Badge variant="default"><T ns="assetsPage" k="statusActive" /></Badge>
                      ) : (
                        <Badge variant="secondary"><T ns="assetsPage" k="statusSold" /></Badge>
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
