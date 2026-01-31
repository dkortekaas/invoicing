'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { vendorSchema, type VendorFormData } from '@/lib/validations'
import { createVendor, updateVendor } from '@/app/leveranciers/actions'

const CATEGORIES = [
  { value: 'OFFICE', label: 'Kantoorkosten' },
  { value: 'TRAVEL', label: 'Reiskosten' },
  { value: 'EQUIPMENT', label: 'Apparatuur' },
  { value: 'SOFTWARE', label: 'Software/Subscriptions' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'EDUCATION', label: 'Opleiding' },
  { value: 'INSURANCE', label: 'Verzekeringen' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'TELECOM', label: 'Telefoon/Internet' },
  { value: 'UTILITIES', label: 'Energie' },
  { value: 'RENT', label: 'Huur' },
  { value: 'MAINTENANCE', label: 'Onderhoud' },
  { value: 'PROFESSIONAL', label: 'Professionele diensten' },
  { value: 'OTHER', label: 'Overig' },
]

interface VendorFormProps {
  vendor?: {
    id: string
    name: string
    aliases: string[]
    defaultCategory: string
    website: string | null
    vatNumber: string | null
  }
  readOnly?: boolean
}

export function VendorForm({ vendor, readOnly = false }: VendorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newAlias, setNewAlias] = useState('')

  const form = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor
      ? {
          name: vendor.name,
          aliases: vendor.aliases || [],
          defaultCategory: vendor.defaultCategory as VendorFormData['defaultCategory'],
          website: vendor.website || '',
          vatNumber: vendor.vatNumber || '',
        }
      : {
          name: '',
          aliases: [] as string[],
          defaultCategory: 'OTHER' as const,
          website: '',
          vatNumber: '',
        },
  })

  const aliases = form.watch('aliases') || []

  const addAlias = () => {
    const trimmed = newAlias.trim()
    if (!trimmed) return
    if (aliases.includes(trimmed)) {
      toast.error('Deze alias bestaat al')
      return
    }
    form.setValue('aliases', [...aliases, trimmed])
    setNewAlias('')
  }

  const removeAlias = (alias: string) => {
    form.setValue(
      'aliases',
      aliases.filter((a) => a !== alias)
    )
  }

  const onSubmit = async (data: unknown) => {
    const validatedData = data as VendorFormData
    if (readOnly) return

    setLoading(true)
    try {
      if (vendor) {
        await updateVendor(vendor.id, validatedData)
        toast.success('Leverancier bijgewerkt')
      } else {
        await createVendor(validatedData)
        toast.success('Leverancier toegevoegd')
      }
      router.push('/leveranciers')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naam *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Bijv. Coolblue, Albert Heijn"
                  {...field}
                  disabled={readOnly}
                />
              </FormControl>
              <FormDescription>
                De naam van de leverancier zoals deze op facturen staat
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standaard Categorie *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={readOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer categorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Uitgaven van deze leverancier worden automatisch in deze categorie gezet
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Aliassen</FormLabel>
          <div className="space-y-3">
            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aliases.map((alias) => (
                  <Badge key={alias} variant="secondary" className="gap-1">
                    {alias}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeAlias(alias)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Voeg alternatieve naam toe"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAlias()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addAlias}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <FormDescription>
            Alternatieve namen waaronder deze leverancier herkend kan worden
          </FormDescription>
        </FormItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.voorbeeld.nl"
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BTW-nummer</FormLabel>
                <FormControl>
                  <Input
                    placeholder="NL123456789B01"
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : vendor ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </div>
        )}

        {readOnly && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Terug
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
