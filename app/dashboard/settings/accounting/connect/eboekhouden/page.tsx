'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EboekhoudenConnectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const gebruikersnaam = (data.get('gebruikersnaam') as string).trim()
    const beveiligingscode1 = (data.get('beveiligingscode1') as string).trim()
    const beveiligingscode2 = (data.get('beveiligingscode2') as string).trim()

    const newErrors: Record<string, string> = {}
    if (!gebruikersnaam) newErrors.gebruikersnaam = 'Verplicht veld'
    if (!beveiligingscode1) newErrors.beveiligingscode1 = 'Verplicht veld'
    if (!beveiligingscode2) newErrors.beveiligingscode2 = 'Verplicht veld'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/accounting/connect/eboekhouden/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gebruikersnaam, beveiligingscode1, beveiligingscode2 }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? 'Verbinden mislukt')
        setIsSubmitting(false)
        return
      }

      toast.success('e-Boekhouden succesvol verbonden')
      router.push('/dashboard/settings/accounting?connected=true')
    } catch {
      toast.error('Er is iets misgegaan. Controleer je internetverbinding.')
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

      {/* Provider identity */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: '#F28C00' }}
        >
          EB
        </div>
        <div>
          <h2 className="text-xl font-bold">e-Boekhouden verbinden</h2>
          <p className="text-muted-foreground text-sm">ZZP</p>
        </div>
      </div>

      {/* Credential form */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Vul je e-Boekhouden API-gegevens in. Je vindt deze onder{' '}
            <strong className="text-foreground">Mijn account → API-instellingen</strong> in
            e-Boekhouden.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gebruikersnaam">Gebruikersnaam</Label>
              <Input
                id="gebruikersnaam"
                name="gebruikersnaam"
                autoComplete="username"
                placeholder="jouw@gebruikersnaam.nl"
                disabled={isSubmitting}
              />
              {errors.gebruikersnaam && (
                <p className="text-destructive text-xs">{errors.gebruikersnaam}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beveiligingscode1">Beveiligingscode 1</Label>
              <Input
                id="beveiligingscode1"
                name="beveiligingscode1"
                type="password"
                autoComplete="off"
                disabled={isSubmitting}
              />
              {errors.beveiligingscode1 && (
                <p className="text-destructive text-xs">{errors.beveiligingscode1}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beveiligingscode2">Beveiligingscode 2</Label>
              <Input
                id="beveiligingscode2"
                name="beveiligingscode2"
                type="password"
                autoComplete="off"
                disabled={isSubmitting}
              />
              {errors.beveiligingscode2 && (
                <p className="text-destructive text-xs">{errors.beveiligingscode2}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href="/dashboard/settings/accounting">Annuleren</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Verbinden…' : 'Verbinden'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
