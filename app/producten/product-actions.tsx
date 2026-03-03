"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProductForm } from "@/components/products/product-form"
import { deleteProduct } from "./actions"
import { useTranslations } from "@/components/providers/locale-provider"
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
  const { t } = useTranslations("productsPage")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteProduct(product.id)
      setIsDeleteDialogOpen(false)
      router.refresh()
      toast.success(t("actionDeleteSuccess"))
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error(t("actionDeleteError"))
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
            <span className="sr-only">{t("actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actionDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("actionDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
