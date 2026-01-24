"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/products/product-form"

export function ProductFormButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Nieuw Product
      </Button>
      <ProductForm open={open} onOpenChange={setOpen} />
    </>
  )
}
