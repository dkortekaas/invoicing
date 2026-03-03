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
import { useTranslations } from "@/components/providers/locale-provider"
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
  /** Optionele primaire kleur (#RRGGBB) voor branding van de submit-knop. */
  primaryColor?: string
}

// ─── Client-side validatie ───────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Stript HTML-tags en gevaarlijke protocollen (definitieve sanitisatie op server). */
function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").trim()
}

function validateForm(
  t: (key: string) => string,
  fields: FormFields,
  canvasEmpty: boolean,
): FieldErrors {
  const errors: FieldErrors = {}

  const name = sanitize(fields.signerName)
  if (name.length < 2) errors.signerName = t("nameMinLength")
  else if (name.length > 100) errors.signerName = t("nameMaxLength")

  const email = fields.signerEmail.trim()
  if (!email) errors.signerEmail = t("emailRequired")
  else if (!EMAIL_RE.test(email)) errors.signerEmail = t("emailInvalid")
  else if (email.length > 255) errors.signerEmail = t("emailTooLong")

  if (fields.signatureType === "DRAWN" && canvasEmpty) {
    errors.signatureData = t("signatureDrawRequired")
  }
  if (fields.signatureType === "TYPED" && sanitize(fields.signerName).length < 2) {
    errors.signatureData = t("signatureTypeRequired")
  }

  if (!fields.agreedToTerms) {
    errors.agreedToTerms = t("agreedRequired")
  }

  return errors
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function SigningForm({ token, agreementText, primaryColor }: SigningFormProps) {
  const { t } = useTranslations("signingForm")
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
    const errors = validateForm(t, fields, canvasEmpty)
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
        setServerError(data.error ?? t("serverError"))
        setPhase("error")
      }
    } catch {
      setServerError(t("connectionError"))
      setPhase("error")
    }
  }

  // ─── Afwijzen ────────────────────────────────────────────────────────────

  async function handleReject(rejectRemarks: string) {
    const name = sanitize(fields.signerName)
    const email = fields.signerEmail.trim()

    if (name.length < 2 || !EMAIL_RE.test(email)) {
      setFieldErrors({
        signerName: name.length < 2 ? t("nameRequiredReject") : undefined,
        signerEmail: !EMAIL_RE.test(email) ? t("emailRequiredReject") : undefined,
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
        setServerError(data.error ?? t("rejectError"))
        setPhase("error")
      }
    } catch {
      setServerError(t("rejectConnectionError"))
      setPhase("error")
    }
  }

  // ─── Resultaatstaten ──────────────────────────────────────────────────────

  if (phase === "signed") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div>
          <p className="text-lg font-semibold text-gray-900">{t("signedTitle")}</p>
          {signedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("signedOn").replace("{date}", formatDateLong(signedAt))}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
            {t("signedThankYou")}
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
          <p className="text-lg font-semibold text-gray-900">{t("declinedTitle")}</p>
          {declinedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("declinedOn").replace("{date}", formatDateLong(declinedAt))}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
            {t("declinedThankYou")}
          </p>
        </div>
      </div>
    )
  }

  const isLoading = phase === "loading"

  // ─── Formulier ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">{t("approveTitle")}</h3>

      {/* Gegevens indiener */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="signerName">
              {t("nameLabel")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signerName"
              value={fields.signerName}
              onChange={(e) => {
                set({ signerName: e.target.value })
                if (fieldErrors.signerName)
                  setFieldErrors((err) => ({ ...err, signerName: undefined }))
              }}
              placeholder={t("namePlaceholder")}
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
              {t("emailLabel")} <span className="text-red-500">*</span>
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
              placeholder={t("emailPlaceholder")}
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
            {t("roleLabel")}{" "}
            <span className="text-muted-foreground font-normal">{t("roleOptional")}</span>
          </Label>
          <Input
            id="signerRole"
            value={fields.signerRole}
            onChange={(e) => set({ signerRole: e.target.value })}
            placeholder={t("rolePlaceholder")}
            maxLength={100}
            disabled={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Handtekening */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("signatureLabel")} <span className="text-red-500">*</span>
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
              {type === "DRAWN" ? t("signatureDraw") : t("signatureType")}
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
                {t("undo")}
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
                {t("clear")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white px-6 py-4 min-h-[80px] flex items-end">
            <span
              style={{ fontFamily: "cursive", fontSize: "2rem", color: "#1a1a1a" }}
              aria-label={t("signaturePlaceholder")}
            >
              {fields.signerName || (
                <span className="text-gray-300" style={{ fontSize: "1.25rem" }}>
                  {t("signaturePlaceholder")}
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
          {t("remarksLabel")}{" "}
          <span className="text-muted-foreground font-normal">{t("roleOptional")}</span>
        </Label>
        <Textarea
          id="remarks"
          value={fields.remarks}
          onChange={(e) => set({ remarks: e.target.value })}
          placeholder={t("remarksPlaceholder")}
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
          {t("rejectButton")}
        </Button>
        <Button
          type="button"
          onClick={handleSign}
          disabled={isLoading}
          className="sm:ml-auto"
          style={
            primaryColor
              ? { backgroundColor: primaryColor, borderColor: primaryColor }
              : undefined
          }
        >
          {isLoading ? t("loading") : t("approveButton")}
        </Button>
      </div>

      {/* Afwijzing bevestiging */}
      {showReject && (
        <RejectDialog
          t={t}
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
  t,
  onCancel,
  onConfirm,
  disabled,
}: {
  t: (key: string) => string
  onCancel: () => void
  onConfirm: (remarks: string) => void
  disabled: boolean
}) {
  const [remarks, setRemarks] = useState("")

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-5 space-y-4">
        <div>
          <p className="font-medium text-red-900">{t("rejectDialogTitle")}</p>
          <p className="text-sm text-red-700 mt-0.5">
            {t("rejectDialogBody")}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rejectRemarks" className="text-sm text-red-900">
            {t("rejectRemarksLabel")}{" "}
            <span className="font-normal text-red-600">{t("roleOptional")}</span>
          </Label>
          <Textarea
            id="rejectRemarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={t("rejectRemarksPlaceholder")}
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
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(remarks)}
            disabled={disabled}
          >
            {t("confirmReject")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
