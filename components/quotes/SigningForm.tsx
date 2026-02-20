"use client"

/**
 * SigningForm — klantformulier voor digitale offerte-ondertekening of -afwijzing.
 *
 * Velden (ondertekening):
 *   signerName    – volledige naam (verplicht, min 2, max 100 tekens)
 *   signerEmail   – e-mailadres (verplicht, email-formaat)
 *   signerRole    – functie/rol (optioneel, max 100 tekens)
 *   signatureType – DRAWN (canvas) of TYPED (naam als handtekening)
 *   signatureData – base64 PNG (DRAWN) of naam-string (TYPED)
 *   agreedToTerms – akkoordvinkje (verplicht)
 *   remarks       – opmerkingen (optioneel, max 1000 tekens)
 *
 * Velden (afwijzing):
 *   signerName, signerEmail, remarks (naam en e-mail worden hergebruikt van het hoofdformulier)
 *
 * XSS-preventie: client-side HTML-tag stripping; server doet definitieve sanitisatie.
 */

import { useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Undo2, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import SignatureCanvas, { type SignatureCanvasRef } from "./SignatureCanvas"
import { cn, formatDateLong } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SignatureType = "DRAWN" | "TYPED"
type Phase = "form" | "loading" | "signed" | "declined" | "error"

interface FormFields {
  signerName: string
  signerEmail: string
  signerRole: string
  signatureType: SignatureType
  agreedToTerms: boolean
  remarks: string
}

interface FieldErrors {
  signerName?: string
  signerEmail?: string
  signerRole?: string
  signatureData?: string
  agreedToTerms?: string
}

export interface SigningFormProps {
  token: string
  agreementText: string
}

// ─── Client-side validatie ───────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Stript HTML-tags en gevaarlijke protocollen (definitieve sanitisatie op server). */
function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").trim()
}

function validateForm(
  fields: FormFields,
  canvasEmpty: boolean,
): FieldErrors {
  const errors: FieldErrors = {}

  const name = sanitize(fields.signerName)
  if (name.length < 2) errors.signerName = "Naam moet minimaal 2 tekens bevatten"
  else if (name.length > 100) errors.signerName = "Naam mag maximaal 100 tekens bevatten"

  const email = fields.signerEmail.trim()
  if (!email) errors.signerEmail = "E-mailadres is verplicht"
  else if (!EMAIL_RE.test(email)) errors.signerEmail = "Voer een geldig e-mailadres in"
  else if (email.length > 255) errors.signerEmail = "E-mailadres is te lang"

  if (fields.signatureType === "DRAWN" && canvasEmpty) {
    errors.signatureData = "Teken uw handtekening in het vak hierboven"
  }
  if (fields.signatureType === "TYPED" && sanitize(fields.signerName).length < 2) {
    errors.signatureData = "Voer eerst uw naam in"
  }

  if (!fields.agreedToTerms) {
    errors.agreedToTerms = "U moet akkoord gaan met de voorwaarden"
  }

  return errors
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function SigningForm({ token, agreementText }: SigningFormProps) {
  const canvasRef = useRef<SignatureCanvasRef>(null)

  const [phase, setPhase] = useState<Phase>("form")
  const [signedAt, setSignedAt] = useState<string | null>(null)
  const [declinedAt, setDeclinedAt] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [canvasEmpty, setCanvasEmpty] = useState(true)
  const [showReject, setShowReject] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [fields, setFields] = useState<FormFields>({
    signerName: "",
    signerEmail: "",
    signerRole: "",
    signatureType: "DRAWN",
    agreedToTerms: false,
    remarks: "",
  })

  const set = (partial: Partial<FormFields>) =>
    setFields((prev) => ({ ...prev, ...partial }))

  // ─── Handtekening type wisselen ──────────────────────────────────────────

  const switchType = (type: SignatureType) => {
    set({ signatureType: type })
    canvasRef.current?.clear()
    setCanvasEmpty(true)
    setFieldErrors((e) => ({ ...e, signatureData: undefined }))
  }

  // ─── Ondertekenen ────────────────────────────────────────────────────────

  async function handleSign() {
    const errors = validateForm(fields, canvasEmpty)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const signatureData =
      fields.signatureType === "DRAWN"
        ? (canvasRef.current?.getDataUrl() ?? "")
        : sanitize(fields.signerName)

    setPhase("loading")
    setServerError(null)

    try {
      const res = await fetch(`/api/signing/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: sanitize(fields.signerName),
          signerEmail: fields.signerEmail.trim().toLowerCase(),
          signerRole: fields.signerRole ? sanitize(fields.signerRole) : undefined,
          signatureType: fields.signatureType,
          signatureData,
          agreedToTerms: true,
          remarks: fields.remarks ? sanitize(fields.remarks) : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSignedAt(data.signedAt)
        setPhase("signed")
      } else if (res.status === 422 && data.fields) {
        // Serverzijdige validatiefouten terug mappen
        setFieldErrors(data.fields as FieldErrors)
        setPhase("form")
      } else {
        setServerError(data.error ?? "Er is een fout opgetreden. Probeer het opnieuw.")
        setPhase("error")
      }
    } catch {
      setServerError("Verbindingsfout. Controleer uw internet en probeer het opnieuw.")
      setPhase("error")
    }
  }

  // ─── Afwijzen ────────────────────────────────────────────────────────────

  async function handleReject(rejectRemarks: string) {
    const name = sanitize(fields.signerName)
    const email = fields.signerEmail.trim()

    if (name.length < 2 || !EMAIL_RE.test(email)) {
      // Vul eerst naam en e-mail in
      setFieldErrors({
        signerName: name.length < 2 ? "Naam is verplicht om af te wijzen" : undefined,
        signerEmail: !EMAIL_RE.test(email) ? "E-mailadres is verplicht om af te wijzen" : undefined,
      })
      setShowReject(false)
      return
    }

    setPhase("loading")
    setServerError(null)

    try {
      const res = await fetch(`/api/signing/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: name,
          signerEmail: email.toLowerCase(),
          remarks: rejectRemarks ? sanitize(rejectRemarks) : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setDeclinedAt(data.declinedAt)
        setPhase("declined")
      } else {
        setServerError(data.error ?? "Er is een fout opgetreden.")
        setPhase("error")
      }
    } catch {
      setServerError("Verbindingsfout. Probeer het opnieuw.")
      setPhase("error")
    }
  }

  // ─── Resultaatstaten ──────────────────────────────────────────────────────

  if (phase === "signed") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div>
          <p className="text-lg font-semibold text-gray-900">Offerte ondertekend</p>
          {signedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Ondertekend op {formatDateLong(signedAt)}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
            Bedankt! De opdrachtgever ontvangt een bevestiging. U ontvangt ook een kopie per e-mail.
          </p>
        </div>
      </div>
    )
  }

  if (phase === "declined") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <div>
          <p className="text-lg font-semibold text-gray-900">Offerte afgewezen</p>
          {declinedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Afgewezen op {formatDateLong(declinedAt)}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
            De opdrachtgever is op de hoogte gesteld van uw beslissing.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = phase === "loading"

  // ─── Formulier ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Offerte goedkeuren</h3>

      {/* Gegevens indiener */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="signerName">
              Naam <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signerName"
              value={fields.signerName}
              onChange={(e) => {
                set({ signerName: e.target.value })
                if (fieldErrors.signerName)
                  setFieldErrors((err) => ({ ...err, signerName: undefined }))
              }}
              placeholder="Uw volledige naam"
              maxLength={100}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.signerName}
            />
            {fieldErrors.signerName && (
              <p className="text-xs text-red-600">{fieldErrors.signerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signerEmail">
              E-mailadres <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signerEmail"
              type="email"
              value={fields.signerEmail}
              onChange={(e) => {
                set({ signerEmail: e.target.value })
                if (fieldErrors.signerEmail)
                  setFieldErrors((err) => ({ ...err, signerEmail: undefined }))
              }}
              placeholder="uw@email.nl"
              maxLength={255}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.signerEmail}
            />
            {fieldErrors.signerEmail && (
              <p className="text-xs text-red-600">{fieldErrors.signerEmail}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signerRole">
            Functie / rol{" "}
            <span className="text-muted-foreground font-normal">(optioneel)</span>
          </Label>
          <Input
            id="signerRole"
            value={fields.signerRole}
            onChange={(e) => set({ signerRole: e.target.value })}
            placeholder="Bijv. Directeur, Inkoopmanager"
            maxLength={100}
            disabled={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Handtekening */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Handtekening <span className="text-red-500">*</span>
        </Label>

        {/* Type selector */}
        <div className="flex gap-2">
          {(["DRAWN", "TYPED"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => switchType(type)}
              disabled={isLoading}
              className={cn(
                "flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                fields.signatureType === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {type === "DRAWN" ? "✍ Tekenen" : "✏ Naam typen"}
            </button>
          ))}
        </div>

        {fields.signatureType === "DRAWN" ? (
          <div className="space-y-2">
            <div className="rounded-lg border bg-white overflow-hidden">
              <SignatureCanvas
                ref={canvasRef}
                className="h-36"
                disabled={isLoading}
                onChange={(empty) => {
                  setCanvasEmpty(empty)
                  if (!empty)
                    setFieldErrors((e) => ({ ...e, signatureData: undefined }))
                }}
              />
            </div>
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => canvasRef.current?.undo()}
                disabled={isLoading || canvasEmpty}
              >
                <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                Ongedaan
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  canvasRef.current?.clear()
                  setCanvasEmpty(true)
                }}
                disabled={isLoading || canvasEmpty}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Wissen
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white px-6 py-4 min-h-[80px] flex items-end">
            <span
              style={{ fontFamily: "cursive", fontSize: "2rem", color: "#1a1a1a" }}
              aria-label="Handtekening preview"
            >
              {fields.signerName || (
                <span className="text-gray-300" style={{ fontSize: "1.25rem" }}>
                  Uw naam verschijnt hier als handtekening
                </span>
              )}
            </span>
          </div>
        )}

        {fieldErrors.signatureData && (
          <p className="text-xs text-red-600">{fieldErrors.signatureData}</p>
        )}
      </div>

      {/* Opmerkingen */}
      <div className="space-y-1.5">
        <Label htmlFor="remarks">
          Opmerkingen{" "}
          <span className="text-muted-foreground font-normal">(optioneel)</span>
        </Label>
        <Textarea
          id="remarks"
          value={fields.remarks}
          onChange={(e) => set({ remarks: e.target.value })}
          placeholder="Eventuele opmerkingen of voorwaarden"
          rows={3}
          maxLength={1000}
          disabled={isLoading}
        />
        {fields.remarks.length > 900 && (
          <p className="text-xs text-muted-foreground text-right">
            {fields.remarks.length}/1000
          </p>
        )}
      </div>

      {/* Akkoord */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreedToTerms"
          checked={fields.agreedToTerms}
          onCheckedChange={(checked) => {
            set({ agreedToTerms: checked === true })
            if (checked) setFieldErrors((e) => ({ ...e, agreedToTerms: undefined }))
          }}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.agreedToTerms}
        />
        <div>
          <label
            htmlFor="agreedToTerms"
            className={cn(
              "text-sm cursor-pointer leading-relaxed",
              fieldErrors.agreedToTerms && "text-red-600",
            )}
          >
            {agreementText}
          </label>
          {fieldErrors.agreedToTerms && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.agreedToTerms}</p>
          )}
        </div>
      </div>

      {/* Serverfout */}
      {phase === "error" && serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Er is iets misgegaan</p>
            <p className="mt-0.5">{serverError}</p>
            <button
              className="mt-1.5 underline text-red-700"
              onClick={() => { setPhase("form"); setServerError(null) }}
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )}

      {/* Actieknoppen */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowReject(true)}
          disabled={isLoading}
          className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          Offerte afwijzen
        </Button>
        <Button
          type="button"
          onClick={handleSign}
          disabled={isLoading}
          className="sm:ml-auto"
        >
          {isLoading ? "Bezig met verwerken…" : "Offerte goedkeuren →"}
        </Button>
      </div>

      {/* Afwijzing bevestiging */}
      {showReject && (
        <RejectDialog
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
          disabled={isLoading}
        />
      )}
    </div>
  )
}

// ─── Afwijzing dialoog ────────────────────────────────────────────────────────

function RejectDialog({
  onCancel,
  onConfirm,
  disabled,
}: {
  onCancel: () => void
  onConfirm: (remarks: string) => void
  disabled: boolean
}) {
  const [remarks, setRemarks] = useState("")

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-5 space-y-4">
        <div>
          <p className="font-medium text-red-900">Offerte afwijzen</p>
          <p className="text-sm text-red-700 mt-0.5">
            Weet u zeker dat u deze offerte wilt afwijzen? De opdrachtgever wordt op de hoogte gesteld.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rejectRemarks" className="text-sm text-red-900">
            Reden / opmerkingen{" "}
            <span className="font-normal text-red-600">(optioneel)</span>
          </Label>
          <Textarea
            id="rejectRemarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Bijv. prijsverschil, andere leverancier gekozen…"
            rows={2}
            maxLength={1000}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(remarks)}
            disabled={disabled}
          >
            Ja, offerte afwijzen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
