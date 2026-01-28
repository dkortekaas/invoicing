import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { ChevronLeft } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AssetForm } from "@/components/assets/asset-form"
import { getAsset } from "../actions"
import { DeleteAssetButton } from "./delete-button"

interface ActivumPageProps {
  params: Promise<{ id: string }>
}

export default async function ActivumPage({ params }: ActivumPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  await requireFeature("tax_reporting")

  const { id } = await params
  const asset = await getAsset(id)

  if (!asset) {
    notFound()
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/activa">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{asset.name}</h2>
              {asset.isActive ? (
                <Badge variant="default">Actief</Badge>
              ) : (
                <Badge variant="secondary">Verkocht</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Aangeschaft op {format(new Date(asset.purchaseDate), "d MMMM yyyy", { locale: nl })}
            </p>
          </div>
        </div>
        <DeleteAssetButton assetId={asset.id} assetName={asset.name} />
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="afschrijving">Afschrijvingsschema</TabsTrigger>
          <TabsTrigger value="bewerken">Bewerken</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overzicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aanschafprijs</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(asset.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Huidige boekwaarde</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(asset.bookValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Restwaarde</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(asset.residualValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Afgeschreven</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(asset.purchasePrice - asset.bookValue)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Afschrijving voortgang</span>
                    <span>
                      {Math.round(
                        ((asset.purchasePrice - asset.bookValue) /
                          (asset.purchasePrice - asset.residualValue)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          ((asset.purchasePrice - asset.bookValue) /
                            (asset.purchasePrice - asset.residualValue)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categorie</p>
                  <p className="font-medium">{asset.category}</p>
                </div>
                {asset.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Beschrijving</p>
                    <p>{asset.description}</p>
                  </div>
                )}
                {asset.supplier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Leverancier</p>
                    <p>{asset.supplier}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Afschrijvingsmethode</p>
                  <p>
                    {asset.depreciationMethod === "LINEAR"
                      ? "Lineair"
                      : "Degressief"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Afschrijvingstermijn</p>
                  <p>{asset.usefulLifeYears} jaar</p>
                </div>
                {asset.kiaApplied && (
                  <div>
                    <p className="text-sm text-muted-foreground">KIA toegepast</p>
                    <p>Ja, in {asset.kiaYear}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="afschrijving" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Afschrijvingsschema</CardTitle>
              <CardDescription>
                Overzicht van de jaarlijkse afschrijvingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {asset.depreciationEntries.length === 0 ? (
                <p className="text-muted-foreground">
                  Geen afschrijvingen beschikbaar
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jaar</TableHead>
                      <TableHead className="text-right">Boekwaarde begin</TableHead>
                      <TableHead className="text-right">Afschrijving</TableHead>
                      <TableHead className="text-right">Boekwaarde eind</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.depreciationEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={entry.year === currentYear ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          {entry.year}
                          {entry.year === currentYear && (
                            <Badge variant="outline" className="ml-2">
                              Huidig
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.bookValueStart)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.bookValueEnd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bewerken" className="mt-6">
          <AssetForm asset={asset} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
