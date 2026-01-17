import Link from "next/link"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FileText } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCustomers } from "./actions"

export default async function KlantenPage() {
  // In productie: haal klanten op uit database
  // const customers = await getCustomers()

  // Placeholder data voor nu
  const customers = [
    {
      id: "1",
      name: "Jan Janssen",
      companyName: "Acme B.V.",
      email: "jan@acme.nl",
      phone: "06-12345678",
      city: "Amsterdam",
      _count: { invoices: 5 },
    },
    {
      id: "2",
      name: "Maria de Vries",
      companyName: "Tech Solutions",
      email: "maria@techsolutions.nl",
      phone: "06-87654321",
      city: "Rotterdam",
      _count: { invoices: 3 },
    },
    {
      id: "3",
      name: "Peter van den Berg",
      companyName: null,
      email: "peter@voorbeeld.nl",
      phone: "06-11223344",
      city: "Utrecht",
      _count: { invoices: 1 },
    },
  ]

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
                customers.map((customer) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acties</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/klanten/${customer.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/facturen/nieuw?klant=${customer.id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Nieuwe factuur
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
