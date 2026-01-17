import Link from "next/link"
import { Plus, Search } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getCustomers } from "./actions"
import { CustomerActions } from "./customer-actions"

export default async function KlantenPage() {
  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Klanten</h2>
          <p className="text-muted-foreground">
            Beheer je klantenbestand
          </p>
        </div>
        <Button asChild>
          <Link href="/klanten/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Klant
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, bedrijf of e-mail..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Plaats</TableHead>
                <TableHead className="text-center">Facturen</TableHead>
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
