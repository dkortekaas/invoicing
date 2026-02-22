"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, CheckCircle2, Loader2, Palette, PenLine } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

const schema = z.object({
  defaultExpiryDays: z.number().int().min(1, "Minimaal 1 dag").max(365, "Maximaal 365 dagen"),
  autoCreateInvoice: z.boolean(),
  requireDrawnSignature: z.boolean(),
  agreementText: z.string().max(2000, "Maximaal 2000 tekens").optional(),
  signingPageMessage: z.string().max(1000, "Maximaal 1000 tekens").optional(),
  logoUrl: z
    .string()
    .max(2048)
    .refine((v) => !v || v.startsWith("http"), "Voer een geldige URL in (beginnend met http)")
    .optional(),
  primaryColor: z
    .string()
    .refine((v) => !v || HEX_COLOR_RE.test(v), "Voer een geldige hex-kleur in (#RRGGBB)")
    .optional(),
})

type FormData = z.infer<typeof schema>

interface OndertekeningFormProps {
  initialData: {
    defaultExpiryDays: number
    autoCreateInvoice: boolean
    requireDrawnSignature: boolean
    agreementText?: string | null
    signingPageMessage?: string | null
    logoUrl?: string | null
    primaryColor?: string | null
  }
}

export function OndertekeningForm({ initialData }: OndertekeningFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultExpiryDays: initialData.defaultExpiryDays,
      autoCreateInvoice: initialData.autoCreateInvoice,
      requireDrawnSignature: initialData.requireDrawnSignature,
      agreementText: initialData.agreementText ?? "",
      signingPageMessage: initialData.signingPageMessage ?? "",
      logoUrl: initialData.logoUrl ?? "",
      primaryColor: initialData.primaryColor ?? "#2563eb",
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/settings/signing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          agreementText: data.agreementText || null,
          signingPageMessage: data.signingPageMessage || null,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? "Instellingen opslaan mislukt")
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Instellingen succesvol opgeslagen!
          </AlertDescription>
        </Alert>
      )}

      {/* Standaard instellingen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Standaard instellingen
          </CardTitle>
          <CardDescription>
            Deze instellingen worden als standaard gebruikt bij het activeren van digitale ondertekening.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Geldigheid */}
          <div className="space-y-1.5">
            <Label htmlFor="defaultExpiryDays">Standaard geldigheid ondertekeningslink (dagen)</Label>
            <Input
              id="defaultExpiryDays"
              type="number"
              min={1}
              max={365}
              className="w-32"
              {...register("defaultExpiryDays", { valueAsNumber: true })}
            />
            {errors.defaultExpiryDays && (
              <p className="text-sm text-red-600">{errors.defaultExpiryDays.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Na dit aantal dagen verloopt de ondertekeningslink automatisch.
            </p>
          </div>

          <Separator />

          {/* Auto-factuur */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="autoCreateInvoice" className="text-sm font-medium">
                Automatisch factuur aanmaken
              </Label>
              <p className="text-xs text-muted-foreground">
                Maak direct een conceptfactuur aan zodra een offerte wordt ondertekend.
              </p>
            </div>
            <Controller
              name="autoCreateInvoice"
              control={control}
              render={({ field }) => (
                <Switch
                  id="autoCreateInvoice"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Separator />

          {/* Getekende handtekening vereisen */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="requireDrawnSignature" className="text-sm font-medium">
                Getekende handtekening vereisen
              </Label>
              <p className="text-xs text-muted-foreground">
                Klanten kunnen alleen een getekende of geüploade handtekening plaatsen.
                Een getypte naam wordt niet geaccepteerd.
              </p>
            </div>
            <Controller
              name="requireDrawnSignature"
              control={control}
              render={({ field }) => (
                <Switch
                  id="requireDrawnSignature"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Huisstijl ondertekeningspagina
          </CardTitle>
          <CardDescription>
            Pas het logo en de primaire kleur aan zodat de ondertekeningspagina
            bij uw huisstijl past.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo-URL (optioneel)</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://uw-website.nl/logo.png"
              {...register("logoUrl")}
            />
            {errors.logoUrl && (
              <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Openbaar toegankelijke URL van uw logo. Overschrijft het bedrijfslogo.
            </p>
          </div>

          <Separator />

          {/* Primaire kleur */}
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Primaire kleur</Label>
            <div className="flex items-center gap-3">
              <Controller
                name="primaryColor"
                control={control}
                render={({ field }) => (
                  <input
                    id="primaryColor"
                    type="color"
                    value={field.value ?? "#2563eb"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-10 w-14 rounded border cursor-pointer p-1"
                  />
                )}
              />
              <Input
                className="w-32 font-mono"
                placeholder="#2563eb"
                {...register("primaryColor")}
              />
            </div>
            {errors.primaryColor && (
              <p className="text-sm text-red-600">{errors.primaryColor.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Kleur voor de akkoord-knop en accentbalk. Hex-formaat, bijv. #2563eb.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teksten */}
      <Card>
        <CardHeader>
          <CardTitle>Teksten op de ondertekeningspagina</CardTitle>
          <CardDescription>
            Pas de standaardteksten aan die de klant te zien krijgt bij het ondertekenen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Persoonlijk bericht */}
          <div className="space-y-1.5">
            <Label htmlFor="signingPageMessage">Persoonlijk bericht (optioneel)</Label>
            <Textarea
              id="signingPageMessage"
              placeholder="Geachte klant, hierbij treft u de offerte aan voor uw beoordeling en akkoord..."
              rows={3}
              {...register("signingPageMessage")}
            />
            {errors.signingPageMessage && (
              <p className="text-sm text-red-600">{errors.signingPageMessage.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dit bericht wordt bovenaan de ondertekeningspagina getoond.
            </p>
          </div>

          <Separator />

          {/* Akkoordtekst */}
          <div className="space-y-1.5">
            <Label htmlFor="agreementText">Akkoordtekst</Label>
            <Textarea
              id="agreementText"
              placeholder="Door het plaatsen van mijn handtekening ga ik akkoord met de inhoud van deze offerte..."
              rows={4}
              {...register("agreementText")}
            />
            {errors.agreementText && (
              <p className="text-sm text-red-600">{errors.agreementText.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              De klant gaat akkoord met deze tekst bij het ondertekenen. Laat leeg voor de standaardtekst.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opslaan...
          </>
        ) : (
          "Instellingen opslaan"
        )}
      </Button>
    </form>
  )
}
