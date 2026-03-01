"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, CheckCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/providers/locale-provider"
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
  const { t } = useTranslations("invoicesPage")
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
          {t("actionSend")}
        </Button>
      )}

      {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
        <Button
          onClick={() => handleStatusUpdate("PAID")}
          disabled={isLoading}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {t("actionMarkPaid")}
        </Button>
      )}

      {invoice.status !== "PAID" && (
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
                {t("actionEdit")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("actionDelete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialogDescPermanent")}
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
              {t("actionDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
