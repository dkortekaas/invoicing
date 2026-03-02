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
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

export default async function ProductenPage() {
  // getServerT needed only for the Input placeholder (string prop)
  const t = await getServerT("productsPage")
  const products = await getProducts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight"><T ns="productsPage" k="title" /></h2>
          <p className="text-muted-foreground">
            <T ns="productsPage" k="description" />
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
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><T ns="productsPage" k="colName" /></TableHead>
                <TableHead><T ns="productsPage" k="colDescription" /></TableHead>
                <TableHead className="text-right"><T ns="productsPage" k="colPrice" /></TableHead>
                <TableHead className="text-center"><T ns="productsPage" k="colUnit" /></TableHead>
                <TableHead className="text-center"><T ns="productsPage" k="colVat" /></TableHead>
                <TableHead className="text-center"><T ns="productsPage" k="colStatus" /></TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      <T ns="productsPage" k="noProducts" />
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
                          {product.isActive ? <T ns="productsPage" k="statusActive" /> : <T ns="productsPage" k="statusInactive" />}
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
