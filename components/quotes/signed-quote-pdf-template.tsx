/**
 * Getekende offerte PDF-template
 *
 * Genereert een volledige A4 PDF met:
 *   - Offerte-inhoud (koptekst, adresblok, regelitems, totalen, notities)
 *   - Ondertekeningsblok (naam, functie, e-mail, datum/tijd CET, IP-adres,
 *     handtekening-afbeelding of getypte naam, opmerkingen, akkoordtekst,
 *     Document ID, verificatie-URL)
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import { formatDate, formatCurrency } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuoteItemData {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  subtotal: number
  total: number
}

export interface QuoteCustomerData {
  name: string
  companyName?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  vatNumber?: string | null
  email?: string | null
}

export interface QuoteCompanyData {
  name: string
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
  logo?: string | null
  vatNumber?: string | null
  kvkNumber?: string | null
  iban?: string | null
}

export interface SignatureData {
  signerName: string
  signerRole?: string | null
  signerEmail: string
  signerIpAddress?: string | null
  signatureMethod: "DRAWN" | "TYPED" | "UPLOADED"
  /** Base64 data-URL voor DRAWN/UPLOADED; getypte naam voor TYPED */
  signatureData: string
  signedAt: Date
  agreementText?: string | null
  remarks?: string | null
  /** Unieke document-ID voor verificatie */
  documentId: string
  /** Volledige URL naar de ondertekeningspagina voor verificatie */
  verificationUrl: string
}

export interface SignedQuoteData {
  quoteNumber: string
  quoteDate: Date
  expiryDate?: Date | null
  reference?: string | null
  notes?: string | null
  subtotal: number
  vatAmount: number
  total: number
  items: QuoteItemData[]
  customer: QuoteCustomerData
  company: QuoteCompanyData
  signature: SignatureData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(amount: number): string {
  return formatCurrency(amount)
}

/** Formatteert datum/tijd in CET-tijdzone (Europe/Amsterdam). */
function fmtSignedAt(date: Date): string {
  return (
    new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " (CET/CEST)"
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  companyInfo: { maxWidth: "55%" },
  logo: { maxWidth: 110, maxHeight: 55, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  companyLine: { fontSize: 9, color: "#4b5563", marginBottom: 1 },
  docTitle: { fontSize: 22, fontWeight: "bold", color: "#2563eb", textAlign: "right" },
  docNumber: { fontSize: 11, textAlign: "right", marginTop: 4, color: "#374151" },
  // Address
  addressSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  addressBlock: { width: "45%" },
  addressLabel: {
    fontSize: 7, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 4,
  },
  addressName: { fontWeight: "bold", marginBottom: 2 },
  addressLine: { fontSize: 9, color: "#374151", marginBottom: 1 },
  // Info grid
  infoGrid: { flexDirection: "row", marginBottom: 24, gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: 7, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 2,
  },
  infoValue: { fontWeight: "bold", fontSize: 10 },
  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row", backgroundColor: "#f3f4f6",
    padding: 7, borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontWeight: "bold", fontSize: 8,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row", padding: 7,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  tableCell: { fontSize: 9 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colVat: { flex: 0.7, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  // Totals
  totalsSection: { marginTop: 8, marginLeft: "auto", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { color: "#6b7280" },
  totalValue: { textAlign: "right" },
  totalRowFinal: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 7, borderTopWidth: 2, borderTopColor: "#1f2937", marginTop: 4,
  },
  totalLabelFinal: { fontWeight: "bold", fontSize: 12 },
  totalValueFinal: { fontWeight: "bold", fontSize: 12, textAlign: "right" },
  // Notes
  notes: {
    marginTop: 16, padding: 10,
    backgroundColor: "#f9fafb", borderRadius: 4,
  },
  notesLabel: {
    fontSize: 7, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 4,
  },
  notesText: { fontSize: 9, color: "#4b5563" },
  // Separator
  separator: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 20 },
  // Signing block
  signingBlock: {
    marginTop: 4,
    padding: 14,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  signingTitle: {
    fontSize: 9, fontWeight: "bold", color: "#15803d",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
  },
  signingRow: { flexDirection: "row", gap: 16 },
  signingLeft: { flex: 1 },
  signingRight: { flex: 1 },
  signingLabel: {
    fontSize: 7, color: "#166534", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 2, marginTop: 8,
  },
  signingValue: { fontSize: 9, color: "#14532d" },
  signingValueBold: { fontSize: 10, fontWeight: "bold", color: "#14532d" },
  // Signature image
  signatureImageWrapper: {
    borderWidth: 1, borderColor: "#86efac", borderRadius: 3,
    backgroundColor: "#ffffff", padding: 4,
    minHeight: 60, marginTop: 4,
  },
  signatureImage: { maxHeight: 80, maxWidth: 200, objectFit: "contain" },
  signatureTyped: {
    fontSize: 22, color: "#14532d", fontStyle: "italic",
    paddingVertical: 8,
  },
  // Remarks
  remarksBox: {
    marginTop: 10, padding: 8,
    backgroundColor: "#dcfce7", borderRadius: 3,
  },
  remarksLabel: {
    fontSize: 7, color: "#166534", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 3,
  },
  remarksText: { fontSize: 9, color: "#14532d", fontStyle: "italic" },
  // Agreement text
  agreementBox: {
    marginTop: 10, padding: 8,
    backgroundColor: "#ffffff", borderRadius: 3,
    borderWidth: 1, borderColor: "#86efac",
  },
  agreementLabel: {
    fontSize: 7, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 3,
  },
  agreementText: { fontSize: 8, color: "#374151" },
  // Footer / document ID
  docFooter: {
    marginTop: 12, flexDirection: "row",
    justifyContent: "space-between", alignItems: "flex-start",
  },
  docIdBox: {},
  docIdLabel: {
    fontSize: 7, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 2,
  },
  docIdValue: { fontSize: 8, color: "#374151", fontWeight: "bold" },
  verifyLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  verifyValue: { fontSize: 8, color: "#1d4ed8" },
})

// ─── Component ────────────────────────────────────────────────────────────────

export function SignedQuotePDF({ quote }: { quote: SignedQuoteData }) {
  const { signature } = quote
  const isDrawnOrUploaded =
    signature.signatureMethod === "DRAWN" || signature.signatureMethod === "UPLOADED"

  // BTW per tarief groeperen voor totalen-sectie
  const vatByRate = quote.items.reduce<Record<string, { subtotal: number; vat: number }>>(
    (acc, item) => {
      const key = `${item.vatRate}`
      if (!acc[key]) acc[key] = { subtotal: 0, vat: 0 }
      acc[key]!.subtotal += item.subtotal
      acc[key]!.vat += item.subtotal * (item.vatRate / 100)
      return acc
    },
    {},
  )

  const APP_URL =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : "http://localhost:3000"

  const logoSrc = quote.company.logo
    ? quote.company.logo.startsWith("http")
      ? quote.company.logo
      : `${APP_URL}${quote.company.logo}`
    : null

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Koptekst ───────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.companyInfo}>
            {logoSrc && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoSrc} style={s.logo} />
            )}
            <Text style={s.companyName}>{quote.company.name}</Text>
            {quote.company.address && (
              <Text style={s.companyLine}>{quote.company.address}</Text>
            )}
            {(quote.company.postalCode || quote.company.city) && (
              <Text style={s.companyLine}>
                {quote.company.postalCode} {quote.company.city}
              </Text>
            )}
            {quote.company.email && (
              <Text style={s.companyLine}>{quote.company.email}</Text>
            )}
            {quote.company.phone && (
              <Text style={s.companyLine}>{quote.company.phone}</Text>
            )}
          </View>
          <View>
            <Text style={s.docTitle}>OFFERTE</Text>
            <Text style={s.docNumber}>{quote.quoteNumber}</Text>
          </View>
        </View>

        {/* ── Adresblok ──────────────────────────────────────────────────── */}
        <View style={s.addressSection}>
          <View style={s.addressBlock}>
            <Text style={s.addressLabel}>Van</Text>
            <Text style={s.addressName}>{quote.company.name}</Text>
            {quote.company.address && (
              <Text style={s.addressLine}>{quote.company.address}</Text>
            )}
            {(quote.company.postalCode || quote.company.city) && (
              <Text style={s.addressLine}>
                {quote.company.postalCode} {quote.company.city}
              </Text>
            )}
            {quote.company.vatNumber && (
              <Text style={[s.addressLine, { marginTop: 3, fontSize: 8 }]}>
                BTW: {quote.company.vatNumber}
              </Text>
            )}
            {quote.company.kvkNumber && (
              <Text style={[s.addressLine, { fontSize: 8 }]}>
                KvK: {quote.company.kvkNumber}
              </Text>
            )}
          </View>
          <View style={s.addressBlock}>
            <Text style={s.addressLabel}>Aan</Text>
            {quote.customer.companyName && (
              <Text style={s.addressName}>{quote.customer.companyName}</Text>
            )}
            <Text
              style={
                !quote.customer.companyName ? s.addressName : s.addressLine
              }
            >
              {quote.customer.name}
            </Text>
            {quote.customer.address && (
              <Text style={s.addressLine}>{quote.customer.address}</Text>
            )}
            {(quote.customer.postalCode || quote.customer.city) && (
              <Text style={s.addressLine}>
                {quote.customer.postalCode} {quote.customer.city}
              </Text>
            )}
            {quote.customer.country && (
              <Text style={s.addressLine}>{quote.customer.country}</Text>
            )}
            {quote.customer.vatNumber && (
              <Text style={[s.addressLine, { marginTop: 3, fontSize: 8 }]}>
                BTW: {quote.customer.vatNumber}
              </Text>
            )}
          </View>
        </View>

        {/* ── Offertegegevens ────────────────────────────────────────────── */}
        <View style={s.infoGrid}>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Offertenummer</Text>
            <Text style={s.infoValue}>{quote.quoteNumber}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Offertedatum</Text>
            <Text style={s.infoValue}>{formatDate(quote.quoteDate)}</Text>
          </View>
          {quote.expiryDate && (
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Geldig tot</Text>
              <Text style={s.infoValue}>{formatDate(quote.expiryDate)}</Text>
            </View>
          )}
          {quote.reference && (
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Referentie</Text>
              <Text style={s.infoValue}>{quote.reference}</Text>
            </View>
          )}
        </View>

        {/* ── Regelitems ─────────────────────────────────────────────────── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colDesc]}>Omschrijving</Text>
            <Text style={[s.tableHeaderCell, s.colQty]}>Aantal</Text>
            <Text style={[s.tableHeaderCell, s.colPrice]}>Prijs</Text>
            <Text style={[s.tableHeaderCell, s.colVat]}>BTW</Text>
            <Text style={[s.tableHeaderCell, s.colTotal]}>Totaal</Text>
          </View>
          {quote.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, s.colDesc]}>{item.description}</Text>
              <Text style={[s.tableCell, s.colQty]}>
                {Number(item.quantity).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}{" "}
                {item.unit}
              </Text>
              <Text style={[s.tableCell, s.colPrice]}>
                {fmtAmount(item.unitPrice)}
              </Text>
              <Text style={[s.tableCell, s.colVat]}>{item.vatRate}%</Text>
              <Text style={[s.tableCell, s.colTotal]}>{fmtAmount(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totalen ────────────────────────────────────────────────────── */}
        <View style={s.totalsSection}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotaal</Text>
            <Text style={s.totalValue}>{fmtAmount(quote.subtotal)}</Text>
          </View>
          {Object.entries(vatByRate).map(([rate, { vat }]) => (
            <View key={rate} style={s.totalRow}>
              <Text style={s.totalLabel}>BTW {rate}%</Text>
              <Text style={s.totalValue}>{fmtAmount(vat)}</Text>
            </View>
          ))}
          <View style={s.totalRowFinal}>
            <Text style={s.totalLabelFinal}>Totaal</Text>
            <Text style={s.totalValueFinal}>{fmtAmount(quote.total)}</Text>
          </View>
        </View>

        {/* ── Notities ───────────────────────────────────────────────────── */}
        {quote.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Opmerkingen</Text>
            <Text style={s.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* ── Scheidingslijn ─────────────────────────────────────────────── */}
        <View style={s.separator} />

        {/* ── Ondertekeningsblok ─────────────────────────────────────────── */}
        <View style={s.signingBlock}>
          <Text style={s.signingTitle}>Digitale handtekening</Text>

          <View style={s.signingRow}>
            {/* Links: handtekening zelf */}
            <View style={s.signingLeft}>
              <Text style={s.signingLabel}>Handtekening</Text>
              <View style={s.signatureImageWrapper}>
                {isDrawnOrUploaded ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image
                    src={signature.signatureData}
                    style={s.signatureImage}
                  />
                ) : (
                  <Text style={s.signatureTyped}>{signature.signatureData}</Text>
                )}
              </View>
            </View>

            {/* Rechts: ondertekeningsgegevens */}
            <View style={s.signingRight}>
              <Text style={s.signingLabel}>Naam</Text>
              <Text style={s.signingValueBold}>{signature.signerName}</Text>

              {signature.signerRole && (
                <>
                  <Text style={s.signingLabel}>Functie</Text>
                  <Text style={s.signingValue}>{signature.signerRole}</Text>
                </>
              )}

              <Text style={s.signingLabel}>E-mailadres</Text>
              <Text style={s.signingValue}>{signature.signerEmail}</Text>

              <Text style={s.signingLabel}>Datum en tijd (CET/CEST)</Text>
              <Text style={s.signingValue}>{fmtSignedAt(signature.signedAt)}</Text>

              {signature.signerIpAddress && (
                <>
                  <Text style={s.signingLabel}>IP-adres</Text>
                  <Text style={s.signingValue}>{signature.signerIpAddress}</Text>
                </>
              )}
            </View>
          </View>

          {/* Opmerkingen klant */}
          {signature.remarks && (
            <View style={s.remarksBox}>
              <Text style={s.remarksLabel}>Opmerkingen klant</Text>
              <Text style={s.remarksText}>&ldquo;{signature.remarks}&rdquo;</Text>
            </View>
          )}

          {/* Akkoordtekst */}
          {signature.agreementText && (
            <View style={s.agreementBox}>
              <Text style={s.agreementLabel}>Akkoordverklaring</Text>
              <Text style={s.agreementText}>{signature.agreementText}</Text>
            </View>
          )}

          {/* Document ID + verificatie-URL */}
          <View style={s.docFooter}>
            <View style={s.docIdBox}>
              <Text style={s.docIdLabel}>Document ID</Text>
              <Text style={s.docIdValue}>{signature.documentId}</Text>
            </View>
            <View>
              <Text style={s.verifyLabel}>Verificatie-URL</Text>
              <Text style={s.verifyValue}>{signature.verificationUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
