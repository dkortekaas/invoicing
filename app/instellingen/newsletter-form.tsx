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
import { toggleNewsletterSubscription } from "./actions"

interface NewsletterFormProps {
  subscribed: boolean
}

export function NewsletterForm({ subscribed }: NewsletterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleToggle() {
    setIsSubmitting(true)
    try {
      await toggleNewsletterSubscription()
      router.refresh()
      toast.success(
        subscribed
          ? "Je bent uitgeschreven van de nieuwsbrief"
          : "Je bent ingeschreven voor de nieuwsbrief"
      )
    } catch {
      toast.error("Er is een fout opgetreden")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwsbrief</CardTitle>
        <CardDescription>
          Ontvang periodiek tips over facturatie, belastingen en ondernemen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {subscribed
                ? "Je bent ingeschreven voor de nieuwsbrief."
                : "Je bent niet ingeschreven voor de nieuwsbrief."}
            </p>
          </div>
          <Button
            variant={subscribed ? "outline" : "default"}
            onClick={handleToggle}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {subscribed ? "Uitschrijven" : "Inschrijven"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
