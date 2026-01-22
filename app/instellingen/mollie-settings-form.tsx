"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, ExternalLink, Eye, EyeOff, CreditCard } from "lucide-react"
import { mollieSettingsSchema, type MollieSettingsFormData } from "@/lib/validations"
import { updateMollieSettings, testMollieConnection } from "./actions"
import { toast } from "sonner"

interface MollieSettingsFormProps {
  initialData: {
    mollieEnabled: boolean
    mollieTestMode: boolean
    hasApiKey: boolean
  }
}

export function MollieSettingsForm({ initialData }: MollieSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    mode?: "test" | "live"
    error?: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MollieSettingsFormData>({
    resolver: zodResolver(mollieSettingsSchema),
    defaultValues: {
      mollieApiKey: "",
      mollieEnabled: initialData.mollieEnabled,
      mollieTestMode: initialData.mollieTestMode,
    },
  })

  const isEnabled = watch("mollieEnabled")
  const isTestMode = watch("mollieTestMode")

  async function onSubmit(data: MollieSettingsFormData) {
    setIsLoading(true)
    try {
      await updateMollieSettings(data)
      toast.success("Mollie instellingen opgeslagen")
      setConnectionStatus(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opslaan mislukt")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTestConnection() {
    setIsTesting(true)
    setConnectionStatus(null)
    try {
      const result = await testMollieConnection()
      setConnectionStatus({
        tested: true,
        success: result.success,
        mode: result.mode,
        error: result.error,
      })
      if (result.success) {
        toast.success(`Verbinding succesvol (${result.mode} mode)`)
      } else {
        toast.error(result.error || "Verbinding mislukt")
      }
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        error: error instanceof Error ? error.message : "Test mislukt",
      })
      toast.error("Verbinding testen mislukt")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Mollie Betalingen</CardTitle>
              <CardDescription>
                Ontvang betalingen via iDEAL, Bancontact en andere betaalmethoden
              </CardDescription>
            </div>
          </div>
          <a
            href="https://www.mollie.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            Account aanmaken
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="mollieEnabled" className="text-base font-medium">
                Mollie betalingen inschakelen
              </Label>
              <p className="text-sm text-muted-foreground">
                Voeg betaallinks toe aan je facturen
              </p>
            </div>
            <Switch
              id="mollieEnabled"
              checked={isEnabled}
              onCheckedChange={(checked) => setValue("mollieEnabled", checked)}
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="mollieApiKey">
              API Key {initialData.hasApiKey && <Badge variant="outline" className="ml-2">Geconfigureerd</Badge>}
            </Label>
            <div className="relative">
              <Input
                id="mollieApiKey"
                type={showApiKey ? "text" : "password"}
                placeholder={initialData.hasApiKey ? "••••••••••••••••••••" : "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                {...register("mollieApiKey")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.mollieApiKey && (
              <p className="text-sm text-destructive">{errors.mollieApiKey.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Vind je API key in het{" "}
              <a
                href="https://my.mollie.com/dashboard/developers/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mollie Dashboard → Developers → API Keys
              </a>
            </p>
          </div>

          {/* Test Mode Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="mollieTestMode" className="text-base font-medium">
                  Test modus
                </Label>
                {isTestMode ? (
                  <Badge variant="secondary">Test</Badge>
                ) : (
                  <Badge variant="default">Live</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isTestMode
                  ? "Gebruik test API key voor het testen van betalingen"
                  : "Gebruik live API key voor echte betalingen"}
              </p>
            </div>
            <Switch
              id="mollieTestMode"
              checked={isTestMode}
              onCheckedChange={(checked) => setValue("mollieTestMode", checked)}
            />
          </div>

          {/* Connection Status */}
          {connectionStatus?.tested && (
            <Alert variant={connectionStatus.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {connectionStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {connectionStatus.success
                    ? `Verbinding succesvol! Mollie is in ${connectionStatus.mode} modus.`
                    : connectionStatus.error || "Verbinding mislukt"}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Info Alert */}
          {!initialData.hasApiKey && (
            <Alert>
              <AlertDescription>
                <strong>Hoe werkt het?</strong>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                  <li>Maak een Mollie account aan of log in</li>
                  <li>Kopieer je API key (test_ of live_)</li>
                  <li>Plak de key hierboven en sla op</li>
                  <li>Klanten kunnen nu betalen via de betaallink op facturen</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
            {initialData.hasApiKey && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test verbinding
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
