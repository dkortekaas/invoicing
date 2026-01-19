"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteCustomer } from "./actions"

interface CustomerActionsProps {
  customer: {
    id: string
    name: string
    _count: { invoices: number }
  }
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (customer._count.invoices > 0) {
      toast.error(
        "Deze klant heeft facturen. Verwijder eerst alle facturen voordat je de klant kunt verwijderen."
      )
      return
    }

    if (!confirm("Weet je zeker dat je deze klant wilt verwijderen?")) {
      return
    }

    setIsLoading(true)
    try {
      await deleteCustomer(customer.id)
      router.refresh()
      toast.success("Klant verwijderd")
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast.error("Fout bij verwijderen klant")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
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
        <DropdownMenuItem
          className="text-red-600"
          onClick={handleDelete}
          disabled={isLoading || customer._count.invoices > 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
