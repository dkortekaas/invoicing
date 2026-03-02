"use client"

import { useState } from "react"
import { Bell, Check, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { sendSigningReminder } from "@/app/offertes/actions"
import { useTranslations } from "@/components/providers/locale-provider"

interface SigningPanelActionsProps {
  quoteId: string
  signingUrl: string
}

export default function SigningPanelActions({
  quoteId,
  signingUrl,
}: SigningPanelActionsProps) {
  const [copied, setCopied] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const { t } = useTranslations("quotesPage")

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(signingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("copyError"))
    }
  }

  async function handleSendReminder() {
    setSendingReminder(true)
    try {
      const result = await sendSigningReminder(quoteId)
      if (result.success) {
        toast.success(t("reminderSent"))
      } else {
        toast.error(result.error ?? t("reminderError"))
      }
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={handleCopyLink}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 mr-1.5" />
        ) : (
          <Copy className="h-3.5 w-3.5 mr-1.5" />
        )}
        {copied ? t("copySuccess") : t("copyLink")}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={handleSendReminder}
        disabled={sendingReminder}
      >
        {sendingReminder ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Bell className="h-3.5 w-3.5 mr-1.5" />
        )}
        {t("reminderButton")}
      </Button>
    </div>
  )
}
