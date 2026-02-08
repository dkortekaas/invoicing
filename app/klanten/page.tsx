import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/import-export"
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
import { getCustomers } from "./actions"
import { CustomerActions } from "./customer-actions"
import { SearchForm } from "./search-form"

const CUSTOMER_SORT_KEYS = ["name", "companyName", "email", "city", "invoiceCount"] as const
type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number]
function isCustomerSortKey(s: string | null | undefined): s is CustomerSortKey {
  return s != null && CUSTOMER_SORT_KEYS.includes(s as CustomerSortKey)
}

interface KlantenPageProps {
  searchParams: Promise<{ search?: string; sortBy?: string; sortOrder?: string }>
}

export default async function KlantenPage({ searchParams }: KlantenPageProps) {
  const params = await searchParams
  const search = params.search ?? ""
  const sortBy = isCustomerSortKey(params.sortBy) ? params.sortBy : "name"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"

  const allCustomers = await getCustomers()

  let customers = search.trim()
    ? allCustomers.filter(
        (c: typeof allCustomers[0]) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.companyName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (c.city ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : allCustomers

  customers = [...customers].sort((a: typeof allCustomers[0], b: typeof allCustomers[0]) => {
    let cmp = 0
    switch (sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name)
        break
      case "companyName":
        cmp = (a.companyName ?? "").localeCompare(b.companyName ?? "")
        break
      case "email":
        cmp = (a.email ?? "").localeCompare(b.email ?? "")
        break
      case "city":
        cmp = (a.city ?? "").localeCompare(b.city ?? "")
        break
      case "invoiceCount":
        cmp = a._count.invoices - b._count.invoices
        break
      default:
        cmp = a.name.localeCompare(b.name)
    }
    return sortOrder === "asc" ? cmp : -cmp
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Klanten</h2>
          <p className="text-muted-foreground">
            Beheer je klantenbestand
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton entityType="CUSTOMERS" totalCount={allCustomers.length} />
          <Button asChild>
            <Link href="/klanten/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Klant
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <SearchForm />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="name">Naam</SortableTableHead>
                <SortableTableHead sortKey="companyName">Bedrijf</SortableTableHead>
                <SortableTableHead sortKey="email">E-mail</SortableTableHead>
                <SortableTableHead sortKey="city">Plaats</SortableTableHead>
                <SortableTableHead sortKey="invoiceCount" className="text-center">Facturen</SortableTableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nog geen klanten. Voeg je eerste klant toe!
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/klanten/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe Klant
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: typeof customers[0]) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/klanten/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.companyName || "-"}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell className="text-center">
                      {customer._count.invoices}
                    </TableCell>
                    <TableCell>
                      <CustomerActions customer={customer} />
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
