"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Loader2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "@/components/providers/locale-provider"

interface PortalLinkProps {
  customerId: string
  initialPortalUrl: string | null
}

export function PortalLink({ customerId, initialPortalUrl }: PortalLinkProps) {
  const { t } = useTranslations("customersPage")
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
        throw new Error(body.error ?? t("portalErrorGenerate"))
      }
      const { portalUrl: url } = await res.json() as { portalUrl: string }
      setPortalUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("portalErrorGeneral"))
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
          {t("portalTitle")}
        </CardTitle>
        <CardDescription>
          {t("portalDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {portalUrl ? (
          <>
            <div className="space-y-1.5">
              <Label>{t("portalLinkLabel")}</Label>
              <div className="flex gap-2">
                <Input value={portalUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title={t("portalCopyTitle")}
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
                  title={t("portalOpenTitle")}
                >
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("portalHelpText")}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("portalEmpty")}
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
              {t("portalGenerating")}
            </>
          ) : portalUrl ? (
            t("portalReuse")
          ) : (
            t("portalGenerate")
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
