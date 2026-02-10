"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  CheckCircle,
  Send,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { updateInvoiceStatus, deleteInvoice } from "./actions"

interface InvoiceActionsProps {
  invoice: {
    id: string
    status: string
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    setIsLoading(true)
    try {
      await deleteInvoice(invoice.id)
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting invoice:", error)
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
        <DropdownMenuItem asChild>
          <Link href={`/facturen/${invoice.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Bekijken
          </Link>
        </DropdownMenuItem>
        {invoice.status !== "PAID" && (
          <DropdownMenuItem asChild>
            <Link href={`/facturen/${invoice.id}/bewerken`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={`/api/invoices/${invoice.id}/pdf`} download>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {invoice.status === "DRAFT" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("SENT")}
            disabled={isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            Markeer als verzonden
          </DropdownMenuItem>
        )}
        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("PAID")}
            disabled={isLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Markeer als betaald
          </DropdownMenuItem>
        )}
        {invoice.status !== "PAID" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijderen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Factuur verwijderen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze factuur wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isLoading}
          >
            Annuleren
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Verwijderen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
