"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { disable2FA, verify2FASetup, generate2FASecret } from "./actions"

interface TwoFactorSetupProps {
  isEnabled: boolean
  hasSecret: boolean
}

export function TwoFactorSetup({ isEnabled, hasSecret }: TwoFactorSetupProps) {
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

  const handleEnable = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await generate2FASecret()
      setQrCode(result.qrCode)
      setSecret(result.secret)
      setStep("verify")
    } catch (err: any) {
      setError(err.message || "Fout bij genereren 2FA secret")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Voer een 6-cijferige code in")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await verify2FASetup(verificationCode)
      setBackupCodes(result.backupCodes)
      setStep("enabled")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ongeldige verificatie code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm("Weet je zeker dat je 2FA wilt uitschakelen? Dit maakt je account minder veilig.")) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await disable2FA()
      setStep("setup")
      setQrCode(null)
      setSecret(null)
      setBackupCodes([])
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Fout bij uitschakelen 2FA")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "enabled") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle>2FA is ingeschakeld</CardTitle>
          </div>
          <CardDescription>
            Je account is beveiligd met twee-factor authenticatie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupCodes.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Backup codes (bewaar deze veilig!):</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="rounded bg-gray-100 p-2 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deze codes worden maar één keer getoond. Bewaar ze op een veilige plek.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShieldOff className="mr-2 h-4 w-4" />
            2FA uitschakelen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifieer 2FA Setup</CardTitle>
          <CardDescription>
            Scan de QR code met je authenticator app en voer de code in
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
              <img src={qrCode} alt="QR Code" className="rounded border" />
            </div>
          )}

          {secret && (
            <div className="space-y-2">
              <Label>Secret Key (voor handmatige invoer)</Label>
              <div className="rounded-md bg-gray-100 p-3 font-mono text-sm">
                {secret}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verificatie Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-sm text-muted-foreground">
              Voer de 6-cijferige code in van je authenticator app
            </p>
          </div>

          <Button onClick={handleVerify} disabled={isLoading || !verificationCode}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verifieer en Activeer
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
          <CardTitle>Twee-Factor Authenticatie</CardTitle>
        </div>
        <CardDescription>
          Voeg een extra beveiligingslaag toe aan je account met een authenticator app
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
            Met twee-factor authenticatie moet je naast je wachtwoord ook een code
            invoeren die gegenereerd wordt door een authenticator app zoals Google
            Authenticator of Authy.
          </p>
        </div>

        <Button onClick={handleEnable} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <ShieldCheck className="mr-2 h-4 w-4" />
          2FA inschakelen
        </Button>
      </CardContent>
    </Card>
  )
}
