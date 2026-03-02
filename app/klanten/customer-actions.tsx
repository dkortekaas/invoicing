"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, FileText, RotateCcw } from "lucide-react"
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
import { deleteCustomer, restoreCustomer } from "./actions"
import { useTranslations } from "@/components/providers/locale-provider"

interface CustomerActionsProps {
  customer: {
    id: string
    name: string
    _count: { invoices: number }
    deletedAt?: Date | null
  }
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const router = useRouter()
  const { t } = useTranslations("customersPage")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteCustomer(customer.id)
      setIsDeleteDialogOpen(false)
      router.refresh()
      toast.success(t("actionMoveToTrash"))
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast.error(t("actionDeleteError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await restoreCustomer(customer.id)
      router.refresh()
      toast.success(t("actionRestored"))
    } catch (error) {
      console.error("Error restoring customer:", error)
      toast.error(t("actionRestoreError"))
    } finally {
      setIsLoading(false)
    }
  }

  // Trash view: only show restore option
  if (customer.deletedAt) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isLoading}
        onClick={handleRestore}
        title={t("actionRestoreTitle")}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="sr-only">{t("actionRestoreLabel")}</span>
      </Button>
    )
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t("actionActionsLabel")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/klanten/${customer.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("actionEdit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/facturen/nieuw?klant=${customer.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            {t("actionNewInvoice")}
          </Link>
        </DropdownMenuItem>
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
            {t("actionCancel")}
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
