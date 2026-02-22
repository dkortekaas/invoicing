"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Loader2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PortalLinkProps {
  customerId: string
  initialPortalUrl: string | null
}

export function PortalLink({ customerId, initialPortalUrl }: PortalLinkProps) {
  const [portalUrl, setPortalUrl] = useState<string | null>(initialPortalUrl)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateLink = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers/${customerId}/portal-token`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? "Kon portaallink niet genereren")
      }
      const { portalUrl: url } = await res.json() as { portalUrl: string }
      setPortalUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="h-4 w-4" />
          Klantportaal
        </CardTitle>
        <CardDescription>
          Geef de klant toegang tot een beveiligde pagina met al hun offertes en de mogelijkheid om
          direct te ondertekenen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {portalUrl ? (
          <>
            <div className="space-y-1.5">
              <Label>Portaallink</Label>
              <div className="flex gap-2">
                <Input value={portalUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Kopieer link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  asChild
                  title="Open portaal"
                >
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stuur deze link naar de klant. Iedereen met de link heeft toegang tot hun offertes.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Er is nog geen portaallink aangemaakt voor deze klant.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          type="button"
          variant={portalUrl ? "outline" : "default"}
          size="sm"
          onClick={generateLink}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Genereren...
            </>
          ) : portalUrl ? (
            "Hergebruik link"
          ) : (
            "Portaallink genereren"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
