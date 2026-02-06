"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link as LinkIcon, Copy, Check, RefreshCw, ExternalLink, QrCode } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { PaymentQRCode } from "./payment-qr-code"

interface PaymentLinkGeneratorProps {
  invoiceId: string
  invoiceNumber: string
  currentToken?: string | null
  expiresAt?: Date | null
  mollieEnabled: boolean
  onGenerateLink: (invoiceId: string) => Promise<{ token: string; expiresAt: Date }>
}

export function PaymentLinkGenerator({
  invoiceId,
  invoiceNumber,
  currentToken,
  expiresAt,
  mollieEnabled,
  onGenerateLink,
}: PaymentLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [token, setToken] = useState<string | null>(currentToken || null)
  const [linkExpiresAt, setLinkExpiresAt] = useState<Date | null>(expiresAt || null)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://declair.app"
  const paymentUrl = token ? `${APP_URL}/pay/${token}` : null

  const isExpired = linkExpiresAt && new Date() > linkExpiresAt

  async function handleGenerateLink() {
    setIsGenerating(true)
    try {
      const result = await onGenerateLink(invoiceId)
      setToken(result.token)
      setLinkExpiresAt(result.expiresAt)
      toast.success("Betaallink aangemaakt")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fout bij aanmaken betaallink")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopyLink() {
    if (!paymentUrl) return

    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopied(true)
      toast.success("Link gekopieerd naar klembord")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopiëren mislukt")
    }
  }

  if (!mollieEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Betaallink
          </CardTitle>
          <CardDescription>
            Stel Mollie in om betaallinks te gebruiken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Configureer je Mollie API key in{" "}
              <a href="/instellingen?tab=betalingen" className="underline text-primary">
                Instellingen → Betalingen
              </a>{" "}
              om betaallinks te activeren.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Betaallink
            </CardTitle>
            <CardDescription>
              Deel een betaallink zodat klanten direct kunnen betalen
            </CardDescription>
          </div>
          {token && !isExpired && (
            <Badge variant="outline" className="shrink-0">
              Geldig t/m {formatDate(linkExpiresAt!)}
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="shrink-0">
              Verlopen
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token && (
          <Button onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Genereer betaallink
              </>
            )}
          </Button>
        )}

        {token && (
          <>
            <div className="flex gap-2">
              <Input
                value={paymentUrl || ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                disabled={!!isExpired}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQR(!showQR)}
                disabled={!!isExpired}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {showQR && paymentUrl && !isExpired && (
              <div className="flex justify-center py-4">
                <PaymentQRCode url={paymentUrl} invoiceNumber={invoiceNumber} />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={!!isExpired}
              >
                <a href={paymentUrl || "#"} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open betaalpagina
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLink}
                disabled={isGenerating}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                {isExpired ? "Nieuwe link genereren" : "Link vernieuwen"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
