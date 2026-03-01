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
import { useTranslations } from "@/components/providers/locale-provider"

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
  const { t } = useTranslations("quotesPage")
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
        toast.error(data.error ?? t("activateError"))
        return
      }

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success(t("activateSuccess"))
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error(t("activateGenericError"))
    } finally {
      setLoading(false)
    }
  }

  const validityHint = validityDays === 1
    ? t("validityHintSingle").replace("{days}", String(validityDays))
    : t("validityHintPlural").replace("{days}", String(validityDays))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("activateTitle")}</DialogTitle>
          <DialogDescription>
            {t("activateDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Validity */}
          <div className="space-y-1.5">
            <Label htmlFor="validityDays">{t("validityLabel")}</Label>
            <Input
              id="validityDays"
              type="number"
              min={1}
              max={365}
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value)))}
            />
            <p className="text-xs text-muted-foreground">
              {validityHint}
            </p>
          </div>

          {/* Auto-invoice */}
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="autoCreateInvoice" className="text-sm font-medium">
                {t("autoInvoiceLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("autoInvoiceDesc")}
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
              {t("cancelButton")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("sendInviteButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
