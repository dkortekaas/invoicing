"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, CheckCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateInvoiceStatus, deleteInvoice } from "../actions"
interface InvoiceActionsClientProps {
  invoice: {
    id: string
    status: string
    subtotal?: number
    vatAmount?: number
    total?: number
    customer?: { name: string; companyName?: string | null }
    user?: { companyName: string }
  }
}

export function InvoiceActionsClient({ invoice }: InvoiceActionsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusUpdate = async (status: "SENT" | "PAID") => {
    setIsLoading(true)
    try {
      await updateInvoiceStatus(invoice.id, status)
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Weet je zeker dat je deze factuur wilt verwijderen?")) {
      return
    }
    setIsLoading(true)
    try {
      await deleteInvoice(invoice.id)
      router.push("/facturen")
    } catch (error) {
      console.error("Error deleting invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {invoice.status === "DRAFT" && (
        <Button
          onClick={() => handleStatusUpdate("SENT")}
          disabled={isLoading}
        >
          <Send className="mr-2 h-4 w-4" />
          Verzenden
        </Button>
      )}

      {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
        <Button
          onClick={() => handleStatusUpdate("PAID")}
          disabled={isLoading}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Markeer als betaald
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/facturen/${invoice.id}/bewerken`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
    </>
  )
}
