/**
 * E-mail verzendlogica voor de digitale offerte-ondertekening flow.
 *
 * Vijf e-mailtypes:
 *   1. sendSigningInvitationEmail  — ondertekeningslink naar klant
 *   2. sendSigningReminderEmail    — herinnering naar klant
 *   3. sendSignedConfirmationEmail — bevestiging aan klant (met PDF bijlage)
 *   4. sendSignedNotificationEmail — notificatie aan gebruiker (met factuurlink)
 *   5. sendDeclinedNotificationEmail — afwijzingsnotificatie aan gebruiker
 */

import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { resend, EMAIL_CONFIG } from "./client"
import { db } from "@/lib/db"
import { logSigningLinkSent, logReminderSent } from "@/lib/quotes/signing-events"
import QuoteSigningInvitationEmail from "@/emails/quote-signing-invitation-email"
import QuoteSigningReminderEmail from "@/emails/quote-signing-reminder-email"
import QuoteSignedConfirmationEmail from "@/emails/quote-signed-confirmation-email"
import QuoteSignedNotificationEmail from "@/emails/quote-signed-notification-email"
import QuoteDeclinedNotificationEmail from "@/emails/quote-declined-notification-email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(date: Date): string {
  return format(date, "dd MMMM yyyy", { locale: nl })
}

function fmtDatetime(date: Date): string {
  return format(date, "dd MMMM yyyy 'om' HH:mm", { locale: nl })
}

function fmtCurrency(amount: { toNumber?: () => number } | number): string {
  const value = typeof amount === "number" ? amount : amount.toNumber?.() ?? 0
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value)
}

async function fetchQuote(quoteId: string) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      signature: true,
      user: {
        select: {
          email: true,
          name: true,
          company: {
            select: { name: true, email: true, phone: true },
          },
          signingSettings: { select: { agreementText: true } },
        },
      },
    },
  })
  if (!quote) throw new Error(`Offerte ${quoteId} niet gevonden`)
  return quote
}

async function logQuoteEmail(
  quoteId: string,
  type: "SIGNING_INVITATION" | "SIGNING_REMINDER" | "SIGNED_CONFIRMATION" | "SIGNED_NOTIFICATION" | "DECLINED_NOTIFICATION",
  recipient: string,
  subject: string,
  status: "SENT" | "FAILED",
  options: { resendId?: string; error?: string } = {},
) {
  await db.quoteEmailLog.create({
    data: {
      quoteId,
      type,
      recipient,
      subject,
      status,
      resendId: options.resendId ?? null,
      error: options.error ?? null,
      sentAt: status === "SENT" ? new Date() : null,
    },
  })
}

// ─── 1. Ondertekeningsuitnodiging → klant ─────────────────────────────────────

export async function sendSigningInvitationEmail(quoteId: string) {
  const quote = await fetchQuote(quoteId)

  if (!quote.customer.email) {
    throw new Error("Klant heeft geen e-mailadres")
  }
  if (!quote.signingUrl) {
    throw new Error("Offerte heeft geen ondertekenings-URL")
  }

  const companyName = quote.user.company?.name ?? ""
  const subject = `Offerte ${quote.quoteNumber} ter ondertekening — ${companyName}`

  const emailProps = {
    customerName: quote.customer.name,
    quoteNumber: quote.quoteNumber,
    quoteDate: fmtDate(quote.quoteDate),
    expiryDate: quote.expiryDate ? fmtDate(quote.expiryDate) : undefined,
    total: fmtCurrency(quote.total),
    companyName,
    companyEmail: quote.user.company?.email ?? (quote.user.email ?? ""),
    companyPhone: quote.user.company?.phone ?? undefined,
    signingUrl: quote.signingUrl,
    notes: quote.notes ?? undefined,
    personalMessage: quote.user.signingSettings?.agreementText ?? undefined,
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: quote.customer.email,
    subject,
    react: QuoteSigningInvitationEmail(emailProps),
  })

  if (error) {
    await logQuoteEmail(quoteId, "SIGNING_INVITATION", quote.customer.email, subject, "FAILED", { error: error.message })
    throw new Error(`Uitnodigingse-mail verzenden mislukt: ${error.message}`)
  }

  await logQuoteEmail(quoteId, "SIGNING_INVITATION", quote.customer.email, subject, "SENT", { resendId: data?.id })

  // Zet quote-status op SENT + signingStatus PENDING
  await db.quote.update({
    where: { id: quoteId },
    data: {
      status: "SENT",
      signingStatus: "PENDING",
      sentAt: new Date(),
    },
  })

  // Audittrail: SENT event loggen
  await logSigningLinkSent(quoteId, quote.customer.email)

  return { success: true, emailId: data?.id }
}

// ─── 2. Herinnering ondertekening → klant ────────────────────────────────────

export async function sendSigningReminderEmail(quoteId: string) {
  const quote = await fetchQuote(quoteId)

  if (!quote.customer.email) throw new Error("Klant heeft geen e-mailadres")
  if (!quote.signingUrl) throw new Error("Offerte heeft geen ondertekenings-URL")
  if (!quote.signingExpiresAt) throw new Error("Offerte heeft geen verloopdatum")

  const daysUntilExpiry = Math.max(
    0,
    Math.ceil((quote.signingExpiresAt.getTime() - Date.now()) / 86_400_000),
  )
  const companyName = quote.user.company?.name ?? ""
  const subject = `Herinnering: offerte ${quote.quoteNumber} verloopt binnenkort`

  const emailProps = {
    customerName: quote.customer.name,
    quoteNumber: quote.quoteNumber,
    total: fmtCurrency(quote.total),
    expiryDate: fmtDate(quote.signingExpiresAt),
    daysUntilExpiry,
    companyName,
    companyEmail: quote.user.company?.email ?? (quote.user.email ?? ""),
    companyPhone: quote.user.company?.phone ?? undefined,
    signingUrl: quote.signingUrl,
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: quote.customer.email,
    subject,
    react: QuoteSigningReminderEmail(emailProps),
  })

  if (error) {
    await logQuoteEmail(quoteId, "SIGNING_REMINDER", quote.customer.email, subject, "FAILED", { error: error.message })
    throw new Error(`Herinnerings-e-mail verzenden mislukt: ${error.message}`)
  }

  await logQuoteEmail(quoteId, "SIGNING_REMINDER", quote.customer.email, subject, "SENT", { resendId: data?.id })

  // Log reminder event + audittrail
  await Promise.allSettled([
    db.quoteSigningReminder.create({
      data: {
        quoteId,
        recipient: quote.customer.email,
        scheduledAt: new Date(),
        sentAt: new Date(),
        status: "SENT",
        subject,
      },
    }),
    logReminderSent(quoteId, quote.customer.email, daysUntilExpiry),
  ])

  return { success: true, emailId: data?.id }
}

// ─── 3. Bevestiging aan klant na ondertekening (met PDF bijlage) ─────────────

export async function sendSignedConfirmationEmail(quoteId: string, pdfBuffer?: Buffer) {
  const quote = await fetchQuote(quoteId)

  if (!quote.customer.email) throw new Error("Klant heeft geen e-mailadres")
  if (!quote.signature) throw new Error("Offerte heeft geen handtekening")

  const companyName = quote.user.company?.name ?? ""
  const subject = `Bevestiging ondertekening offerte ${quote.quoteNumber}`

  const emailProps = {
    customerName: quote.customer.name,
    signerName: quote.signature.signerName,
    quoteNumber: quote.quoteNumber,
    quoteDate: fmtDate(quote.quoteDate),
    total: fmtCurrency(quote.total),
    signedAt: fmtDatetime(quote.signature.signedAt),
    companyName,
    companyEmail: quote.user.company?.email ?? (quote.user.email ?? ""),
    companyPhone: quote.user.company?.phone ?? undefined,
  }

  const attachments = pdfBuffer
    ? [{ filename: `Offerte-${quote.quoteNumber}-ondertekend.pdf`, content: pdfBuffer }]
    : []

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: quote.customer.email,
    subject,
    react: QuoteSignedConfirmationEmail(emailProps),
    attachments,
  })

  if (error) {
    await logQuoteEmail(quoteId, "SIGNED_CONFIRMATION", quote.customer.email, subject, "FAILED", { error: error.message })
    throw new Error(`Bevestigings-e-mail verzenden mislukt: ${error.message}`)
  }

  await logQuoteEmail(quoteId, "SIGNED_CONFIRMATION", quote.customer.email, subject, "SENT", { resendId: data?.id })

  return { success: true, emailId: data?.id }
}

// ─── 4. Notificatie aan gebruiker na ondertekening (met factuurlink) ──────────

export async function sendSignedNotificationEmail(
  quoteId: string,
  options: { invoiceId?: string; invoiceNumber?: string } = {},
) {
  const quote = await fetchQuote(quoteId)

  const userEmail = quote.user.email
  if (!userEmail) throw new Error("Gebruiker heeft geen e-mailadres")
  if (!quote.signature) throw new Error("Offerte heeft geen handtekening")

  const companyName = quote.user.company?.name ?? ""
  const subject = `Offerte ${quote.quoteNumber} is ondertekend door ${quote.signature.signerName}`

  const invoiceUrl = options.invoiceId
    ? `${APP_URL}/facturen/${options.invoiceId}`
    : undefined

  const emailProps = {
    userName: quote.user.name ?? companyName,
    quoteNumber: quote.quoteNumber,
    signerName: quote.signature.signerName,
    signerEmail: quote.signature.signerEmail,
    signedAt: fmtDatetime(quote.signature.signedAt),
    total: fmtCurrency(quote.total),
    customerName: quote.customer.companyName ?? quote.customer.name,
    quoteUrl: `${APP_URL}/offertes/${quoteId}`,
    invoiceUrl,
    invoiceNumber: options.invoiceNumber,
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: userEmail,
    subject,
    react: QuoteSignedNotificationEmail(emailProps),
  })

  if (error) {
    await logQuoteEmail(quoteId, "SIGNED_NOTIFICATION", userEmail, subject, "FAILED", { error: error.message })
    throw new Error(`Notificatie-e-mail verzenden mislukt: ${error.message}`)
  }

  await logQuoteEmail(quoteId, "SIGNED_NOTIFICATION", userEmail, subject, "SENT", { resendId: data?.id })

  return { success: true, emailId: data?.id }
}

// ─── 5. Afwijzingsnotificatie aan gebruiker ───────────────────────────────────

export async function sendDeclinedNotificationEmail(
  quoteId: string,
  declineInfo: { signerName: string; signerEmail: string; remarks?: string },
) {
  const quote = await fetchQuote(quoteId)

  const userEmail = quote.user.email
  if (!userEmail) throw new Error("Gebruiker heeft geen e-mailadres")

  const subject = `Offerte ${quote.quoteNumber} is afgewezen`

  const emailProps = {
    userName: quote.user.name ?? (quote.user.company?.name ?? ""),
    quoteNumber: quote.quoteNumber,
    signerName: declineInfo.signerName,
    signerEmail: declineInfo.signerEmail,
    declinedAt: fmtDatetime(new Date()),
    total: fmtCurrency(quote.total),
    customerName: quote.customer.companyName ?? quote.customer.name,
    quoteUrl: `${APP_URL}/offertes/${quoteId}`,
    remarks: declineInfo.remarks,
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: userEmail,
    subject,
    react: QuoteDeclinedNotificationEmail(emailProps),
  })

  if (error) {
    await logQuoteEmail(quoteId, "DECLINED_NOTIFICATION", userEmail, subject, "FAILED", { error: error.message })
    throw new Error(`Afwijzings-e-mail verzenden mislukt: ${error.message}`)
  }

  await logQuoteEmail(quoteId, "DECLINED_NOTIFICATION", userEmail, subject, "SENT", { resendId: data?.id })

  return { success: true, emailId: data?.id }
}
