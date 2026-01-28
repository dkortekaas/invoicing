import { Search } from "lucide-react"

export const dynamic = "force-dynamic"
import { Input } from "@/components/ui/input"
import { ExportButton } from "@/components/import-export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { getProducts } from "./actions"
import { ProductActions } from "./product-actions"
import { ProductFormButton } from "./product-form-button"

export default async function ProductenPage() {
  const products = await getProducts()

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
        <div className="flex gap-2">
          <ExportButton entityType="PRODUCTS" totalCount={products.length} />
          <ProductFormButton />
        </div>
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
                    <ProductFormButton />
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: typeof products[0]) => {
                  const productData = {
                    id: product.id,
                    name: product.name,
                    description: product.description || "",
                    unitPrice: product.unitPrice,
                    vatRate: product.vatRate,
                    unit: product.unit,
                    isActive: product.isActive,
                  };

                  return (
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
                      <TableCell className="text-center">
                        {product.vatRate}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                        >
                          {product.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ProductActions product={productData} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
