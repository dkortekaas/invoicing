/**
 * GET /api/cron/signing-reminders
 *
 * Dagelijkse cron job (zie vercel.json: "0 8 * * *") die automatische
 * herinneringen verstuurt voor offerte-ondertekeningen die binnenkort verlopen.
 *
 * Logica:
 *   AUTO_7_DAYS  — verloopdatum ligt 6–8 dagen in de toekomst
 *   AUTO_3_DAYS  — verloopdatum ligt 2–4 dagen in de toekomst
 *   AUTO_EXPIRY  — verloopdatum lag 0–24 uur geleden (net verlopen)
 *
 * Per quotetype:
 *   1. Haal kandidaten op (signingStatus PENDING/VIEWED, expiresAt in venster)
 *   2. Dedupliceer: sla over als er al een reminder van dit type is verstuurd
 *   3. Controleer UserSigningSettings.sendReminders (opt-out mogelijk)
 *   4. Verstuur herinneringse-mail + log QuoteSigningReminder + QuoteSigningEvent
 *
 * Beveiliging: Bearer-token via CRON_SECRET (ingesteld in Vercel dashboard).
 */

import { type NextRequest, NextResponse } from "next/server"
import { type ReminderType } from "@prisma/client"
import { db } from "@/lib/db"
import { sendSigningReminderEmail } from "@/lib/email/send-quote-signing"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minuten maximale uitvoertijd

// ─── Tijdsvensters ────────────────────────────────────────────────────────────

interface ReminderBatch {
  reminderType: ReminderType
  windowStart: number // ms relatief aan nu (positief = toekomst)
  windowEnd: number   // ms relatief aan nu
}

const MS = {
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

const BATCHES: ReminderBatch[] = [
  {
    reminderType: "AUTO_7_DAYS",
    windowStart: 6 * MS.d,   // 6 dagen in de toekomst
    windowEnd:   8 * MS.d,   // 8 dagen in de toekomst
  },
  {
    reminderType: "AUTO_3_DAYS",
    windowStart: 2 * MS.d,
    windowEnd:   4 * MS.d,
  },
  {
    reminderType: "AUTO_EXPIRY",
    windowStart: -24 * MS.h, // 24 uur geleden
    windowEnd:   0,          // nu
  },
]

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Vercel cron-beveiliging via Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()

  const results = {
    AUTO_7_DAYS: { sent: 0, skipped: 0, errors: 0 },
    AUTO_3_DAYS: { sent: 0, skipped: 0, errors: 0 },
    AUTO_EXPIRY: { sent: 0, skipped: 0, errors: 0 },
  }

  for (const batch of BATCHES) {
    const windowFrom = new Date(now.getTime() + batch.windowStart)
    const windowTo   = new Date(now.getTime() + batch.windowEnd)

    // 1. Kandidaat-offertes in het tijdsvenster
    const candidates = await db.quote.findMany({
      where: {
        signingEnabled: true,
        signingStatus:  { in: ["PENDING", "VIEWED"] },
        signingExpiresAt: { gte: windowFrom, lte: windowTo },
      },
      select: { id: true, userId: true },
    })

    if (candidates.length === 0) continue

    // 2. Deduplicatie: welke quotes kregen dit type reminder al?
    const quoteIds = candidates.map((q) => q.id)
    const alreadySent = await db.quoteSigningReminder.findMany({
      where: {
        quoteId:      { in: quoteIds },
        reminderType: batch.reminderType,
        status:       "SENT",
      },
      select: { quoteId: true },
    })
    const alreadySentSet = new Set(alreadySent.map((r) => r.quoteId))

    // 3. Batch-ophalen van gebruikersinstellingen
    const userIds = [...new Set(candidates.map((q) => q.userId))]
    const settingsRows = await db.userSigningSettings.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, sendReminders: true },
    })
    const settingsMap = new Map(settingsRows.map((s) => [s.userId, s]))

    // 4. Verwerken
    const key = batch.reminderType as keyof typeof results
    for (const quote of candidates) {
      if (alreadySentSet.has(quote.id)) {
        results[key].skipped++
        continue
      }

      // Respect gebruikers-opt-out
      const settings = settingsMap.get(quote.userId)
      if (settings?.sendReminders === false) {
        results[key].skipped++
        continue
      }

      try {
        await sendSigningReminderEmail(quote.id, { reminderType: batch.reminderType })
        results[key].sent++
      } catch (err) {
        console.error(
          `[cron/signing-reminders] ${batch.reminderType} mislukt voor quote ${quote.id}:`,
          err,
        )
        results[key].errors++
      }
    }
  }

  const totalSent = Object.values(results).reduce((s, r) => s + r.sent, 0)

  return NextResponse.json({
    ok: true,
    runAt: now.toISOString(),
    totalSent,
    details: results,
  })
}
