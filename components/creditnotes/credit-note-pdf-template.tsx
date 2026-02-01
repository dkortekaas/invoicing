import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer"
import { formatDate, formatCurrencyWithCode, formatNumber, CREDIT_NOTE_REASON_LABELS } from "@/lib/utils"
import { getWatermarkContainerStyles, getWatermarkTextStyles, shouldShowWatermark } from "@/lib/pdf/watermark"
import type { SystemSettings } from "@prisma/client"

// Types
interface CreditNoteItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  subtotal: number
}

interface Customer {
  name: string
  companyName?: string | null
  address: string
  postalCode: string
  city: string
  country: string
  vatNumber?: string | null
}

interface Company {
  companyName: string
  companyEmail: string
  companyPhone?: string | null
  companyAddress: string
  companyPostalCode: string
  companyCity: string
  companyCountry: string
  companyLogo?: string | null
  vatNumber?: string | null
  kvkNumber?: string | null
  iban?: string | null
}

interface CreditNoteData {
  creditNoteNumber: string
  creditNoteDate: Date
  reason: string
  description?: string | null
  notes?: string | null
  originalInvoiceNumber?: string | null
  subtotal: number
  vatAmount: number
  total: number
  currencyCode?: string
  customer: Customer
  items: CreditNoteItem[]
  company: Company
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: "50%",
  },
  logoContainer: {
    marginBottom: 8,
  },
  logo: {
    maxWidth: 120,
    maxHeight: 60,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626", // Red for credit notes
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  addressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  addressBlock: {
    width: "45%",
  },
  addressLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addressName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  addressLine: {
    marginBottom: 1,
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontWeight: "bold",
  },
  reasonBox: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  reasonLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: {
    fontWeight: "bold",
    color: "#dc2626",
  },
  reasonDescription: {
    marginTop: 4,
    fontSize: 9,
    color: "#4b5563",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    fontSize: 10,
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: "right",
  },
  colPrice: {
    flex: 1,
    textAlign: "right",
  },
  colVat: {
    flex: 0.7,
    textAlign: "right",
  },
  colTotal: {
    flex: 1.2,
    textAlign: "right",
  },
  creditAmount: {
    color: "#dc2626",
  },
  totalsSection: {
    marginTop: 10,
    marginLeft: "auto",
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    color: "#6b7280",
  },
  totalValue: {
    textAlign: "right",
    color: "#dc2626",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: "#dc2626",
    marginTop: 4,
  },
  totalLabelFinal: {
    fontWeight: "bold",
    fontSize: 12,
  },
  totalValueFinal: {
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "right",
    color: "#dc2626",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginBottom: 15,
  },
  paymentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentBlock: {
    width: "30%",
  },
  paymentLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentValue: {
    fontSize: 9,
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
  },
})

interface CreditNotePDFProps {
  creditNote: CreditNoteData
  watermarkSettings?: SystemSettings | null
  userTier?: string
}

export function CreditNotePDF({ creditNote, watermarkSettings, userTier = 'FREE' }: CreditNotePDFProps) {
  const currencyCode = creditNote.currencyCode || "EUR"

  // Group VAT by rate
  const vatByRate = creditNote.items.reduce((acc, item) => {
    const rate = item.vatRate.toString()
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 }
    }
    acc[rate].subtotal += item.subtotal
    acc[rate].vatAmount += item.subtotal * (item.vatRate / 100)
    return acc
  }, {} as Record<string, { subtotal: number; vatAmount: number }>)

  // Check if watermark should be shown
  const showWatermark = watermarkSettings && userTier
    ? shouldShowWatermark(userTier, watermarkSettings)
    : false

  // Get watermark styles if needed
  const watermarkContainerStyle = watermarkSettings && showWatermark
    ? StyleSheet.create({
        container: getWatermarkContainerStyles(watermarkSettings),
        text: getWatermarkTextStyles(watermarkSettings),
      })
    : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {creditNote.company.companyLogo && (
              <View style={styles.logoContainer}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */}
                <Image
                  src={creditNote.company.companyLogo.startsWith("http")
                    ? creditNote.company.companyLogo
                    : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${creditNote.company.companyLogo}`}
                  style={styles.logo}
                />
              </View>
            )}
            <Text style={styles.companyName}>{creditNote.company.companyName}</Text>
            <Text style={styles.addressLine}>{creditNote.company.companyAddress}</Text>
            <Text style={styles.addressLine}>
              {creditNote.company.companyPostalCode} {creditNote.company.companyCity}
            </Text>
            <Text style={styles.addressLine}>{creditNote.company.companyEmail}</Text>
            {creditNote.company.companyPhone && (
              <Text style={styles.addressLine}>{creditNote.company.companyPhone}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>CREDIT NOTA</Text>
            <Text style={styles.invoiceNumber}>{creditNote.creditNoteNumber}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Klantadres</Text>
            {creditNote.customer.companyName && (
              <Text style={styles.addressName}>{creditNote.customer.companyName}</Text>
            )}
            <Text style={!creditNote.customer.companyName ? styles.addressName : styles.addressLine}>
              {creditNote.customer.name}
            </Text>
            <Text style={styles.addressLine}>{creditNote.customer.address}</Text>
            <Text style={styles.addressLine}>
              {creditNote.customer.postalCode} {creditNote.customer.city}
            </Text>
            <Text style={styles.addressLine}>{creditNote.customer.country}</Text>
            {creditNote.customer.vatNumber && (
              <Text style={[styles.addressLine, { marginTop: 4, fontSize: 8 }]}>
                BTW: {creditNote.customer.vatNumber}
              </Text>
            )}
          </View>
          <View style={styles.addressBlock} />
        </View>

        {/* Credit note info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Datum</Text>
            <Text style={styles.infoValue}>{formatDate(creditNote.creditNoteDate)}</Text>
          </View>
          {creditNote.originalInvoiceNumber && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Originele factuur</Text>
              <Text style={styles.infoValue}>{creditNote.originalInvoiceNumber}</Text>
            </View>
          )}
        </View>

        {/* Reason box */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reden credit nota</Text>
          <Text style={styles.reasonText}>
            {CREDIT_NOTE_REASON_LABELS[creditNote.reason] || creditNote.reason}
          </Text>
          {creditNote.description && (
            <Text style={styles.reasonDescription}>{creditNote.description}</Text>
          )}
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Omschrijving
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Aantal
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Prijs
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colVat]}>
              BTW
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Credit
            </Text>
          </View>

          {/* Rows */}
          {creditNote.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>
                {formatNumber(item.quantity, 2)} {item.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCurrencyWithCode(item.unitPrice, currencyCode)}
              </Text>
              <Text style={[styles.tableCell, styles.colVat]}>
                {item.vatRate}%
              </Text>
              <Text style={[styles.tableCell, styles.colTotal, styles.creditAmount]}>
                -{formatCurrencyWithCode(item.subtotal, currencyCode)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>
              -{formatCurrencyWithCode(creditNote.subtotal, currencyCode)}
            </Text>
          </View>

          {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
            <View key={rate} style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                BTW {rate}% over {formatCurrencyWithCode(subtotal, currencyCode)}
              </Text>
              <Text style={styles.totalValue}>
                -{formatCurrencyWithCode(vatAmount, currencyCode)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Credit Totaal</Text>
            <Text style={styles.totalValueFinal}>
              -{formatCurrencyWithCode(creditNote.total, currencyCode)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {creditNote.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Opmerkingen</Text>
            <Text style={styles.notesText}>{creditNote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.paymentInfo}>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>IBAN</Text>
              <Text style={styles.paymentValue}>{creditNote.company.iban}</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>BTW-nummer</Text>
              <Text style={styles.paymentValue}>{creditNote.company.vatNumber}</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>KvK-nummer</Text>
              <Text style={styles.paymentValue}>{creditNote.company.kvkNumber}</Text>
            </View>
          </View>
        </View>

        {/* Watermark - alleen voor free users */}
        {showWatermark && watermarkSettings && watermarkContainerStyle && (
          <View style={watermarkContainerStyle.container} fixed>
            <Text style={watermarkContainerStyle.text}>
              {watermarkSettings.watermarkText}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
