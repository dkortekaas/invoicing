'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/locale-provider'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteVendor } from './actions'

interface VendorActionsProps {
  vendor: {
    id: string
    name: string
  }
}

export function VendorActions({ vendor }: VendorActionsProps) {
  const { t } = useTranslations("vendorsPage")
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteVendor(vendor.id)
      toast.success('Leverancier verwijderd')
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acties</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/leveranciers/${vendor.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('edit')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialogDesc').replace('{name}', vendor.name)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
