"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductForm } from "@/components/products/product-form"
import { deleteProduct } from "./actions"
interface ProductActionsProps {
  product: {
    id: string
    name: string
    description: string | null
    unitPrice: number
    vatRate: number
    unit: string
    isActive: boolean
  }
}

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen?")) {
      return
    }

    setIsLoading(true)
    try {
      await deleteProduct(product.id)
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Fout bij verwijderen product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acties</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Bewerken
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        product={{
          id: product.id,
          name: product.name,
          description: product.description || "",
          unitPrice: product.unitPrice,
          vatRate: product.vatRate,
          unit: product.unit,
          isActive: product.isActive,
        }}
      />
    </>
  )
}
