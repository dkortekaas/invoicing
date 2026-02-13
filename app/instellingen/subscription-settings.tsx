"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { ExternalLink, FileText, CreditCard, Loader2, RefreshCw, Receipt } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TIER_LABELS: Record<string, string> = {
  FREE: "Gratis",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  BUSINESS: "Business",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actief",
  TRIALING: "Proefperiode",
  PAST_DUE: "Betaling achterstallig",
  CANCELED: "Opgezegd",
  INCOMPLETE: "Incompleet",
  INCOMPLETE_EXPIRED: "Verlopen",
  UNPAID: "Onbetaald",
  FREE: "Gratis",
}

interface SubscriptionData {
  tier: string
  status: string
  currentPeriodEnd: string | null
  billingCycle: string | null
  cancelAtPeriodEnd?: boolean
  cancelAt: string | null
  invoiceCount: number | null
  invoiceCountResetAt: string | null
  hasStripeSubscription?: boolean
}

export function SubscriptionSettings() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [invoiceExpenseLoading, setInvoiceExpenseLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/stripe/subscription", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refetch = () => {
    setLoading(true)
    fetch("/api/stripe/subscription", { cache: "no-store" })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  const syncWithStripe = async () => {
    setSyncLoading(true)
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" })
      const json = await res.json()
      if (json.synced) {
        toast.success("Abonnement bijgewerkt")
        refetch()
      } else {
        toast.error(json?.error ?? "Geen abonnement gevonden in Stripe")
      }
    } catch {
      toast.error("Synchronisatie mislukt")
    } finally {
      setSyncLoading(false)
    }
  }

  const addInvoiceToExpenses = async () => {
    setInvoiceExpenseLoading(true)
    try {
      const res = await fetch("/api/stripe/sync-invoice-expense", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? "Kon facturen niet toevoegen")
        return
      }
      const n = json.created ?? 0
      if (n > 0) toast.success(`${n} abonnementsfactuur${n > 1 ? "en" : ""} toegevoegd aan kosten`)
      else toast.info("Geen nieuwe facturen om toe te voegen")
    } catch {
      toast.error("Actie mislukt")
    } finally {
      setInvoiceExpenseLoading(false)
    }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const returnUrl = `${base}/instellingen?tab=abonnement`
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? "Kon geen portal openen")
        return
      }
      if (json.url) window.open(json.url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error("Er is een fout opgetreden")
    } finally {
      setPortalLoading(false)
    }
  }

  const isPaidTier = data && data.tier !== "FREE"
  const isStripeSubscription = Boolean(data?.hasStripeSubscription)
  const hasPortal = isPaidTier && isStripeSubscription && data?.status

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {data ? TIER_LABELS[data.tier] ?? data.tier : "Gratis"}
              </CardTitle>
              <CardDescription>
                {isPaidTier
                  ? isStripeSubscription
                    ? "Je Stripe-abonnement en facturatie"
                    : "Dit abonnement is handmatig toegewezen (niet via Stripe)."
                  : "Je gebruikt het gratis plan. Upgrade voor meer functies."}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isPaidTier && !isStripeSubscription && (
                  <Badge variant="secondary">Handmatig toegewezen</Badge>
                )}
                {data?.status && (
                  <Badge variant={data.status === "ACTIVE" || data.status === "TRIALING" ? "default" : "secondary"}>
                    {STATUS_LABELS[data.status] ?? data.status}
                  </Badge>
                )}
                {isStripeSubscription && Boolean(data?.cancelAtPeriodEnd) && (
                  <Badge variant="secondary">Wordt opgezegd</Badge>
                )}
              </div>
            </div>
            {hasPortal && (
              <Button onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Beheer abonnement & facturen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPaidTier && isStripeSubscription && data?.currentPeriodEnd && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Huidige periode</p>
              <p className="text-sm text-muted-foreground">
                {Boolean(data.cancelAtPeriodEnd) ? (
                  <>
                    Geannuleerd – loopt door tot {formatDate(data.currentPeriodEnd)}
                    {data.billingCycle === "YEARLY" && " (jaarlijks)"}
                    {data.billingCycle === "MONTHLY" && " (maandelijks)"}
                  </>
                ) : (
                  <>
                    Vernieuwt op {formatDate(data.currentPeriodEnd)}
                    {data.billingCycle === "YEARLY" && " (jaarlijks)"}
                    {data.billingCycle === "MONTHLY" && " (maandelijks)"}
                  </>
                )}
              </p>
            </div>
          )}

          {hasPortal && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">In het Stripe-portaal kun je:</p>
              <ul className="text-sm text-muted-foreground space-y-1 flex flex-wrap gap-x-6 gap-y-1">
                <li className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Facturen bekijken en downloaden
                </li>
                <li className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  Betaalmethode wijzigen
                </li>
                <li>Abonnement opzeggen of wijzigen</li>
              </ul>
            </div>
          )}

          {!isPaidTier && (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Upgrade naar Starter, Professional of Business voor onbeperkt factureren, OCR, BTW-overzichten en meer.
              </p>
              <Button asChild variant="default" size="sm">
                <Link href="/upgrade">Bekijk abonnementen</Link>
              </Button>
            </div>
          )}

          {isPaidTier && isStripeSubscription && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={syncWithStripe}
                disabled={syncLoading}
                className="text-muted-foreground"
              >
                {syncLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncLoading ? "Synchroniseren…" : "Synchroniseer met Stripe"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addInvoiceToExpenses}
                disabled={invoiceExpenseLoading}
                className="text-muted-foreground"
              >
                {invoiceExpenseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                {invoiceExpenseLoading ? "Bezig…" : "Abonnementsfactuur toevoegen aan kosten"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
