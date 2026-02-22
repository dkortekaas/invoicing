/**
 * GET  /api/settings/signing  — Haal gebruikersinstellingen voor ondertekening op
 * PATCH /api/settings/signing  — Sla gebruikersinstellingen voor ondertekening op
 *
 * Werkt met het UserSigningSettings model (upsert — aanmaken bij eerste gebruik).
 */

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// ─── Validatie schema ─────────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

const signingSettingsSchema = z.object({
  defaultExpiryDays: z.number().int().min(1).max(365),
  autoCreateInvoice: z.boolean(),
  requireDrawnSignature: z.boolean(),
  agreementText: z.string().max(2000).optional().nullable(),
  signingPageMessage: z.string().max(1000).optional().nullable(),
  logoUrl: z.string().url("Voer een geldige URL in").max(2048).optional().nullable(),
  primaryColor: z
    .string()
    .regex(HEX_COLOR_RE, "Voer een geldige hex-kleur in (#RRGGBB)")
    .optional()
    .nullable(),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  let userId: string
  try {
    userId = await getCurrentUserId()
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const settings = await db.userSigningSettings.findUnique({
    where: { userId },
  })

  // Geef standaardwaarden terug als de instellingen nog niet bestaan
  return NextResponse.json(
    settings ?? {
      defaultExpiryDays: 14,
      autoCreateInvoice: true,
      requireDrawnSignature: false,
      agreementText: null,
      signingPageMessage: null,
      logoUrl: null,
      primaryColor: null,
    },
  )
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  let userId: string
  try {
    userId = await getCurrentUserId()
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 })
  }

  const parsed = signingSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const settings = await db.userSigningSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...parsed.data,
      agreementText: parsed.data.agreementText ?? null,
      signingPageMessage: parsed.data.signingPageMessage ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
      primaryColor: parsed.data.primaryColor ?? null,
    },
    update: {
      ...parsed.data,
      agreementText: parsed.data.agreementText ?? null,
      signingPageMessage: parsed.data.signingPageMessage ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
      primaryColor: parsed.data.primaryColor ?? null,
    },
  })

  return NextResponse.json(settings)
}
