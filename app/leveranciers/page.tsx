import Link from "next/link"
import { Plus, Building2 } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserVendors } from "./actions"
import { VendorActions } from "./vendor-actions"
import { VendorSearchForm } from "./vendor-search-form"

const CATEGORY_LABELS: Record<string, string> = {
  OFFICE: 'Kantoorkosten',
  TRAVEL: 'Reiskosten',
  EQUIPMENT: 'Apparatuur',
  SOFTWARE: 'Software/Subscriptions',
  MARKETING: 'Marketing',
  EDUCATION: 'Opleiding',
  INSURANCE: 'Verzekeringen',
  ACCOUNTANT: 'Accountant',
  TELECOM: 'Telefoon/Internet',
  UTILITIES: 'Energie',
  RENT: 'Huur',
  MAINTENANCE: 'Onderhoud',
  PROFESSIONAL: 'Professionele diensten',
  OTHER: 'Overig',
}

const VENDOR_SORT_KEYS = ["name", "defaultCategory", "useCount"] as const
type VendorSortKey = (typeof VENDOR_SORT_KEYS)[number]
function isVendorSortKey(s: string | null | undefined): s is VendorSortKey {
  return s != null && VENDOR_SORT_KEYS.includes(s as VendorSortKey)
}

interface LeveranciersPageProps {
  searchParams: Promise<{ search?: string; sortBy?: string; sortOrder?: string }>
}

export default async function LeveranciersPage({ searchParams }: LeveranciersPageProps) {
  const params = await searchParams
  const search = params.search ?? ""
  const sortBy = isVendorSortKey(params.sortBy) ? params.sortBy : "name"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"

  const allVendors = await getUserVendors()

  let vendors = search.trim()
    ? allVendors.filter(
        (v: typeof allVendors[0]) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
      )
    : allVendors

  vendors = [...vendors].sort((a: typeof allVendors[0], b: typeof allVendors[0]) => {
    let cmp = 0
    switch (sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name)
        break
      case "defaultCategory":
        cmp = a.defaultCategory.localeCompare(b.defaultCategory)
        break
      case "useCount":
        cmp = a.useCount - b.useCount
        break
      default:
        cmp = a.name.localeCompare(b.name)
    }
    return sortOrder === "asc" ? cmp : -cmp
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leveranciers</h2>
          <p className="text-muted-foreground">
            Beheer je leveranciers voor automatische categorisatie
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/leveranciers/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Leverancier
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <VendorSearchForm />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="name">Naam</SortableTableHead>
                <TableHead>Aliassen</TableHead>
                <SortableTableHead sortKey="defaultCategory">Standaard Categorie</SortableTableHead>
                <SortableTableHead sortKey="useCount" className="text-center">Gebruikt</SortableTableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nog geen leveranciers. Voeg je eerste leverancier toe!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Leveranciers worden ook automatisch aangemaakt bij het verwerken van bonnen.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/leveranciers/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe Leverancier
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor: typeof vendors[0]) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Link
                        href={`/leveranciers/${vendor.id}`}
                        className="font-medium hover:underline"
                      >
                        {vendor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {vendor.aliases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {vendor.aliases.slice(0, 3).map((alias, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {alias}
                            </Badge>
                          ))}
                          {vendor.aliases.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.aliases.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[vendor.defaultCategory] || vendor.defaultCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {vendor._count.expenses}
                    </TableCell>
                    <TableCell>
                      <VendorActions vendor={vendor} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
