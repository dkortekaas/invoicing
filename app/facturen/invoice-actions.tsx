"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/components/providers/locale-provider"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  CheckCircle,
  Send,
  Eye,
  RotateCcw,
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
import { updateInvoiceStatus, deleteInvoice, restoreInvoice } from "./actions"

interface InvoiceActionsProps {
  invoice: {
    id: string
    status: string
    deletedAt?: Date | null
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
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
      router.refresh()
    } catch (error) {
      console.error("Error deleting invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await restoreInvoice(invoice.id)
      router.refresh()
    } catch (error) {
      console.error("Error restoring invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Trash view: only show restore option
  if (invoice.deletedAt) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isLoading}
        onClick={handleRestore}
        title={t("actionRestoreTitle")}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="sr-only">{t("actionRestore")}</span>
      </Button>
    )
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("actionActions")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/facturen/${invoice.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            {t("actionView")}
          </Link>
        </DropdownMenuItem>
        {invoice.status !== "PAID" && (
          <DropdownMenuItem asChild>
            <Link href={`/facturen/${invoice.id}/bewerken`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("actionEdit")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={`/api/invoices/${invoice.id}/pdf`} download>
            <Download className="mr-2 h-4 w-4" />
            {t("actionDownloadPDF")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {invoice.status === "DRAFT" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("SENT")}
            disabled={isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("actionMarkSent")}
          </DropdownMenuItem>
        )}
        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("PAID")}
            disabled={isLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {t("actionMarkPaid")}
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
              {t("actionDelete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("deleteDialogDescTrash")}
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
