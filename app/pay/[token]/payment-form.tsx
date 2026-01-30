"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CreditCard } from "lucide-react"
import { getAvailableIssuers, initiatePayment } from "./actions"
import { formatCurrency } from "@/lib/utils"

interface Issuer {
  id: string
  name: string
  image?: {
    size1x?: string
    size2x?: string
    svg?: string
  }
}

interface PaymentFormProps {
  token: string
  invoiceId: string
  amount: number
  pendingPayment: {
    id: string
    status: string
  } | null
}

export function PaymentForm({ token, invoiceId, amount, pendingPayment }: PaymentFormProps) {
  const [issuers, setIssuers] = useState<Issuer[]>([])
  const [selectedIssuer, setSelectedIssuer] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadIssuers() {
      try {
        const data = await getAvailableIssuers(invoiceId)
        setIssuers(data)
      } catch (err) {
        console.error("Failed to load issuers:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadIssuers()
  }, [invoiceId])

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await initiatePayment(token, selectedIssuer || undefined)

      if (result.success) {
        // Redirect to Mollie checkout
        window.location.href = result.checkoutUrl
      } else {
        setError(result.error)
        setIsSubmitting(false)
      }
    } catch (_err) {
      setError("Er is een fout opgetreden. Probeer het opnieuw.")
      setIsSubmitting(false)
    }
  }

  // Show pending payment status
  if (pendingPayment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Er is al een betaling gestart voor deze factuur. Wacht tot deze is afgerond of probeer het later opnieuw.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Kies je bank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : issuers.length > 0 ? (
          <RadioGroup
            value={selectedIssuer}
            onValueChange={setSelectedIssuer}
            className="grid grid-cols-2 gap-3"
          >
            {issuers.map((issuer) => (
              <div key={issuer.id}>
                <RadioGroupItem
                  value={issuer.id}
                  id={issuer.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={issuer.id}
                  className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                >
                  {issuer.image?.svg && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={issuer.image.svg}
                        alt={issuer.name}
                        className="h-6 w-6 object-contain"
                      />
                    </>
                  )}
                  <span className="text-sm font-medium">{issuer.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Alert>
            <AlertDescription>
              Selecteer je bank tijdens het betaalproces
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Doorsturen naar bank...
            </>
          ) : (
            <>
              Betaal {formatCurrency(amount)}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Je wordt doorgestuurd naar de beveiligde betaalomgeving van je bank
        </p>
      </CardContent>
    </Card>
  )
}
