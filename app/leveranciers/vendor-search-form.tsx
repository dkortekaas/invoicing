'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from '@/components/providers/locale-provider'
import { Input } from '@/components/ui/input'

export function VendorSearchForm() {
  const { t } = useTranslations('vendorsPage')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('search') ?? '')

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set('search', term)
      } else {
        params.delete('search')
      }
      startTransition(() => {
        router.push(`/leveranciers?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={t("searchPlaceholder")}
        className="pl-9"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          handleSearch(e.target.value)
        }}
        disabled={isPending}
      />
    </div>
  )
}
