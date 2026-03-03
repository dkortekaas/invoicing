"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { useTranslations } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { disable2FA, verify2FASetup, generate2FASecret } from "./actions"

interface TwoFactorSetupProps {
  isEnabled: boolean
  hasSecret: boolean
}

export function TwoFactorSetup({ isEnabled, hasSecret }: TwoFactorSetupProps) {
  const { t } = useTranslations("settingsPage")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"setup" | "verify" | "enabled">(
    isEnabled ? "enabled" : hasSecret ? "verify" : "setup"
  )
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)

  const handleEnable = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await generate2FASecret()
      setQrCode(result.qrCode)
      setSecret(result.secret)
      setStep("verify")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("twoFactorErrorGenerate"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t("twoFactorErrorCodeRequired"))
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await verify2FASetup(verificationCode)
      setBackupCodes(result.backupCodes)
      setStep("enabled")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("twoFactorErrorInvalidCode"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await disable2FA()
      setIsDisableDialogOpen(false)
      setStep("setup")
      setQrCode(null)
      setSecret(null)
      setBackupCodes([])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("twoFactorErrorDisable"))
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "enabled") {
    return (
      <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle>{t("twoFactorEnabledTitle")}</CardTitle>
          </div>
          <CardDescription>
            {t("twoFactorEnabledDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupCodes.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{t("twoFactorBackupCodes")}</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code: string, i: number) => (
                      <div key={i} className="rounded bg-gray-100 p-2 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("twoFactorBackupCodesHelp")}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="destructive"
            onClick={() => setIsDisableDialogOpen(true)}
            disabled={isLoading}
          >
            <ShieldOff className="mr-2 h-4 w-4" />
            {t("twoFactorDisable")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("twoFactorDisableDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("twoFactorDisableDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDisableDialogOpen(false)}
              disabled={isLoading}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uitschakelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("twoFactorVerifyTitle")}</CardTitle>
          <CardDescription>
            {t("twoFactorVerifyDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrCode && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code is a data URL, next/image does not support */}
              <img src={qrCode} alt={t("twoFactorQrAlt")} className="rounded border" />
            </div>
          )}

          {secret && (
            <div className="space-y-2">
              <Label>{t("twoFactorSecretLabel")}</Label>
              <div className="rounded-md bg-gray-100 p-3 font-mono text-sm">
                {secret}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">{t("twoFactorVerificationCode")}</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder={t("twoFactorVerificationPlaceholder")}
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-sm text-muted-foreground">
              {t("twoFactorVerificationHelp")}
            </p>
          </div>

          <Button onClick={handleVerify} disabled={isLoading || !verificationCode}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("twoFactorVerifyButton")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>{t("twoFactorSetupTitle")}</CardTitle>
        </div>
        <CardDescription>
          {t("twoFactorSetupDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("twoFactorSetupInfo")}
          </p>
        </div>

        <Button onClick={handleEnable} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ShieldCheck className="mr-2 h-4 w-4" />
          {t("twoFactorEnable")}
        </Button>
      </CardContent>
    </Card>
  )
}
