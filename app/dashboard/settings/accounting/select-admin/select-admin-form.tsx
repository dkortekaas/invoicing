'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountingProvider } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface SelectAdminFormProps {
  provider: AccountingProvider
  providerName: string
  administrations: Array<{ id: string; name: string }>
}

export function SelectAdminForm({ provider, providerName, administrations }: SelectAdminFormProps) {
  const router = useRouter()
  const [selectedAdminId, setSelectedAdminId] = useState(administrations[0]?.id ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAdminId) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/accounting/connect/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, adminId: selectedAdminId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Verbinden mislukt')
      }

      toast.success(`${providerName} succesvol verbonden`)
      router.push('/dashboard/settings/accounting?connected=true')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/settings/accounting"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Boekhoudkoppelingen
      </Link>

      <div>
        <h2 className="text-xl font-bold">Administratie kiezen</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Je {providerName}-account heeft meerdere administraties. Kies welke je wilt koppelen aan
          Declair.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <RadioGroup value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <div className="space-y-3">
                {administrations.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-3">
                    <RadioGroupItem value={admin.id} id={`admin-${admin.id}`} />
                    <Label htmlFor={`admin-${admin.id}`} className="cursor-pointer font-normal">
                      {admin.name}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/dashboard/settings/accounting">Annuleren</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedAdminId}>
            {isSubmitting ? 'Verbinden…' : 'Verbinden'}
          </Button>
        </div>
      </form>
    </div>
  )
}
