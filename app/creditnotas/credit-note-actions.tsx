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
  Lock,
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
import { updateCreditNoteStatus, deleteCreditNote } from "./actions"
import type { CreditNoteStatus } from "@prisma/client"

interface CreditNoteActionsProps {
  creditNote: {
    id: string
    status: string
  }
}

export function CreditNoteActions({ creditNote }: CreditNoteActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
    if (!confirm("Weet je zeker dat je deze credit nota wilt verwijderen?")) {
      return
    }
    setIsLoading(true)
    try {
      await deleteCreditNote(creditNote.id)
      router.refresh()
    } catch (error) {
      console.error("Error deleting credit note:", error)
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
          <Link href={`/creditnotas/${creditNote.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Bekijken
          </Link>
        </DropdownMenuItem>
        {creditNote.status === "DRAFT" && (
          <DropdownMenuItem asChild>
            <Link href={`/creditnotas/${creditNote.id}/bewerken`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href={`/api/creditnotes/${creditNote.id}/pdf`} download>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {creditNote.status === "DRAFT" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("FINAL")}
            disabled={isLoading}
          >
            <Lock className="mr-2 h-4 w-4" />
            Definitief maken
          </DropdownMenuItem>
        )}
        {creditNote.status === "FINAL" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("SENT")}
            disabled={isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            Markeer als verzonden
          </DropdownMenuItem>
        )}
        {creditNote.status === "SENT" && (
          <>
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("PROCESSED")}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Markeer als verwerkt
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("REFUNDED")}
              disabled={isLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Markeer als terugbetaald
            </DropdownMenuItem>
          </>
        )}
        {creditNote.status === "PROCESSED" && (
          <DropdownMenuItem
            onClick={() => handleStatusUpdate("REFUNDED")}
            disabled={isLoading}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Markeer als terugbetaald
          </DropdownMenuItem>
        )}
        {creditNote.status === "DRAFT" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijderen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
