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
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteCustomer(customer.id)
      setIsDeleteDialogOpen(false)
      router.refresh()
      toast.success("Klant naar prullenbak verplaatst")
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast.error("Fout bij verwijderen klant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await restoreCustomer(customer.id)
      router.refresh()
      toast.success("Klant hersteld")
    } catch (error) {
      console.error("Error restoring customer:", error)
      toast.error("Fout bij herstellen klant")
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
        title="Herstellen uit prullenbak"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="sr-only">Herstellen</span>
      </Button>
    )
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
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Klant verwijderen</DialogTitle>
          <DialogDescription>
            De klant wordt naar de prullenbak verplaatst en kan daarna worden hersteld via de prullenbakweergave.
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
