"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SigningActivationModalProps {
  quoteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SigningActivationModal({
  quoteId,
  open,
  onOpenChange,
}: SigningActivationModalProps) {
  const router = useRouter()
  const [validityDays, setValidityDays] = useState(14)
  const [autoCreateInvoice, setAutoCreateInvoice] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/quotes/${quoteId}/signing/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validityDays, autoCreateInvoice }),
      })

      const data = await res.json() as {
        success?: boolean
        error?: string
        warning?: string
        signingUrl?: string
      }

      if (!res.ok) {
        toast.error(data.error ?? "Er is een fout opgetreden")
        return
      }

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success("Ondertekeningsverzoek verstuurd naar de klant")
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Er is een onverwachte fout opgetreden. Probeer het opnieuw.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Digitale ondertekening activeren</DialogTitle>
          <DialogDescription>
            De klant ontvangt een e-mail met een persoonlijke link om de offerte
            digitaal te ondertekenen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Geldigheid */}
          <div className="space-y-1.5">
            <Label htmlFor="validityDays">Link geldig voor (dagen)</Label>
            <Input
              id="validityDays"
              type="number"
              min={1}
              max={365}
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value)))}
            />
            <p className="text-xs text-muted-foreground">
              Na {validityDays} {validityDays === 1 ? "dag" : "dagen"} verloopt de ondertekeningslink automatisch.
            </p>
          </div>

          {/* Auto-factuur */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="autoCreateInvoice" className="text-sm font-medium">
                Automatisch factuur aanmaken
              </Label>
              <p className="text-xs text-muted-foreground">
                Maak direct een conceptfactuur aan zodra de offerte wordt ondertekend.
              </p>
            </div>
            <Switch
              id="autoCreateInvoice"
              checked={autoCreateInvoice}
              onCheckedChange={setAutoCreateInvoice}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verstuur uitnodiging
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
