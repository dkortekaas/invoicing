"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslations } from "@/components/providers/locale-provider"
import { toggleNewsletterSubscription } from "./actions"

interface NewsletterFormProps {
  subscribed: boolean
}

export function NewsletterForm({ subscribed }: NewsletterFormProps) {
  const router = useRouter()
  const { t } = useTranslations("settingsPage")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleToggle() {
    setIsSubmitting(true)
    try {
      await toggleNewsletterSubscription()
      router.refresh()
      toast.success(
        subscribed
          ? t("newsletterFormSuccessUnsubscribed")
          : t("newsletterFormSuccessSubscribed")
      )
    } catch {
      toast.error(t("newsletterFormError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("newsletterFormTitle")}</CardTitle>
        <CardDescription>
          {t("newsletterFormDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {subscribed
                ? t("newsletterFormSubscribed")
                : t("newsletterFormNotSubscribed")}
            </p>
          </div>
          <Button
            variant={subscribed ? "outline" : "default"}
            onClick={handleToggle}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {subscribed ? t("newsletterFormUnsubscribe") : t("newsletterFormSubscribe")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
