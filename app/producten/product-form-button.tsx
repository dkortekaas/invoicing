"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/products/product-form"
import { T } from "@/components/t"

export function ProductFormButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        <T ns="productsPage" k="newProduct" />
      </Button>
      <ProductForm open={open} onOpenChange={setOpen} />
    </>
  )
}
