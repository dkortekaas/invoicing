import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

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
import { getCustomers, getDeletedCustomerCount } from "./actions"
import { CustomerActions } from "./customer-actions"
import { SearchForm } from "./search-form"
import { Pagination } from "@/components/ui/pagination"

const PAGE_SIZE = 50

const CUSTOMER_SORT_KEYS = ["name", "companyName", "email", "city", "invoiceCount"] as const
type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number]
function isCustomerSortKey(s: string | null | undefined): s is CustomerSortKey {
  return s != null && CUSTOMER_SORT_KEYS.includes(s as CustomerSortKey)
}

interface KlantenPageProps {
  searchParams: Promise<{ search?: string; sortBy?: string; sortOrder?: string; page?: string; deleted?: string }>
}

export default async function KlantenPage({ searchParams }: KlantenPageProps) {
  const params = await searchParams
  const showDeleted = params.deleted === "true"
  const search = params.search ?? ""
  const sortBy = isCustomerSortKey(params.sortBy) ? params.sortBy : "name"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)

  const [{ customers: paginatedCustomers, total: totalItems }, deletedCount] = await Promise.all([
    getCustomers({
      search: search.trim() || undefined,
      sortBy,
      sortOrder,
      page: currentPage,
      pageSize: PAGE_SIZE,
      deletedOnly: showDeleted,
    }),
    getDeletedCustomerCount(),
  ])

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
          {!showDeleted && <ExportButton entityType="CUSTOMERS" totalCount={totalItems} />}
          {showDeleted ? (
            <Button variant="outline" asChild>
              <Link href="/klanten">Terug naar klanten</Link>
            </Button>
          ) : (
            <>
              {deletedCount > 0 && (
                <Button variant="outline" asChild>
                  <Link href="/klanten?deleted=true">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Prullenbak ({deletedCount})
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/klanten/nieuw">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Klant
                </Link>
              </Button>
            </>
          )}
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
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {showDeleted ? (
                      <p className="text-muted-foreground">
                        De prullenbak is leeg.
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Nog geen klanten. Voeg je eerste klant toe!
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/klanten/nieuw">
                            <Plus className="mr-2 h-4 w-4" />
                            Nieuwe Klant
                          </Link>
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer: typeof paginatedCustomers[0]) => (
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
                      <CustomerActions customer={{ ...customer, deletedAt: customer.deletedAt ?? null }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
