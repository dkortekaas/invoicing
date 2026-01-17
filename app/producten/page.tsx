"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ProductForm } from "@/components/products/product-form"

// Placeholder data
const products = [
  {
    id: "1",
    name: "Consultancy",
    description: "Strategisch advies en consultancy",
    unitPrice: 95.0,
    vatRate: 21,
    unit: "uur",
    isActive: true,
  },
  {
    id: "2",
    name: "Ontwikkeling",
    description: "Software development werkzaamheden",
    unitPrice: 85.0,
    vatRate: 21,
    unit: "uur",
    isActive: true,
  },
  {
    id: "3",
    name: "Training",
    description: "Training en workshops",
    unitPrice: 750.0,
    vatRate: 21,
    unit: "dag",
    isActive: true,
  },
  {
    id: "4",
    name: "Support",
    description: "Technische ondersteuning",
    unitPrice: 65.0,
    vatRate: 21,
    unit: "uur",
    isActive: false,
  },
]

export default function ProductenPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<(typeof products)[0] | null>(
    null
  )

  const handleEdit = (product: (typeof products)[0]) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditingProduct(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Producten & Diensten</h2>
          <p className="text-muted-foreground">
            Beheer je producten en diensten voor facturatie
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuw Product
        </Button>
      </div>

      {/* Products list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek producten..."
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
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right">Prijs</TableHead>
                <TableHead className="text-center">Eenheid</TableHead>
                <TableHead className="text-center">BTW</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nog geen producten. Voeg je eerste product toe!
                    </p>
                    <Button className="mt-4" onClick={() => setFormOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nieuw Product
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className={!product.isActive ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center capitalize">
                      {product.unit}
                    </TableCell>
                    <TableCell className="text-center">{product.vatRate}%</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Actief" : "Inactief"}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bewerken
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

      {/* Product form dialog */}
      <ProductForm
        open={formOpen}
        onOpenChange={handleClose}
        product={editingProduct ?? undefined}
      />
    </div>
  )
}
