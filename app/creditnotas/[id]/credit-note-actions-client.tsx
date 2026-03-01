"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Send,
  CheckCircle,
  CreditCard,
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
import { updateCreditNoteStatus, deleteCreditNote } from "../actions"
import type { CreditNoteStatus } from "@prisma/client"
import { useTranslations } from "@/components/providers/locale-provider"

interface CreditNoteActionsClientProps {
  creditNote: {
    id: string
    status: string
  }
}

export function CreditNoteActionsClient({ creditNote }: CreditNoteActionsClientProps) {
  const router = useRouter()
  const { t } = useTranslations("creditNotesPage")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleStatusUpdate = async (status: CreditNoteStatus) => {
    setIsLoading(true)
    try {
      await updateCreditNoteStatus(creditNote.id, status)
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
      await deleteCreditNote(creditNote.id)
      setIsDeleteDialogOpen(false)
      router.push("/creditnotas")
      router.refresh()
    } catch (error) {
      console.error("Error deleting credit note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <MoreHorizontal className="mr-2 h-4 w-4" />
          {t("actionsButton")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {creditNote.status === "DRAFT" && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/creditnotas/${creditNote.id}/bewerken`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("editAction")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("FINAL")}
              disabled={isLoading}
            >
              <Lock className="mr-2 h-4 w-4" />
              {t("makeFinalAction")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("deleteAction")}
            </DropdownMenuItem>
          </>
        )}
        {creditNote.status === "FINAL" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("SENT")}
            disabled={isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("markSentAction")}
          </DropdownMenuItem>
        )}
        {creditNote.status === "SENT" && (
          <>
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("PROCESSED")}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("markProcessedAction")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("REFUNDED")}
              disabled={isLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("markRefundedAction")}
            </DropdownMenuItem>
          </>
        )}
        {creditNote.status === "PROCESSED" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("REFUNDED")}
            disabled={isLoading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t("markRefundedAction")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("deleteDialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isLoading}
          >
            {t("cancelButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {t("deleteAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
