import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer"
import { formatDate, formatCurrency, formatCurrencyWithCode, formatNumber, formatExchangeRate, formatDateLong } from "@/lib/utils"
import { getWatermarkContainerStyles, getWatermarkTextStyles, shouldShowWatermark } from "@/lib/pdf/watermark"
import type { SystemSettings } from "@prisma/client"

// Types
interface InvoiceItem {
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

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  reference?: string | null
  notes?: string | null
  subtotal: number
  vatAmount: number
  total: number
  // Currency support
  currencyCode?: string
  exchangeRate?: number | null
  exchangeRateDate?: Date | null
  exchangeRateSource?: "ECB" | "MANUAL" | null
  subtotalEur?: number | null
  vatAmountEur?: number | null
  totalEur?: number | null
  customer: Customer
  items: InvoiceItem[]
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
    color: "#2563eb",
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
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: "#1f2937",
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
  eurEquivalent: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  eurEquivalentLabel: {
    fontSize: 8,
    color: "#0369a1",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eurEquivalentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  eurEquivalentText: {
    fontSize: 9,
    color: "#0c4a6e",
  },
  eurEquivalentNote: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 6,
    fontStyle: "italic",
  },
})

interface InvoicePDFProps {
  invoice: InvoiceData
  watermarkSettings?: SystemSettings | null
  userTier?: string
  useKOR?: boolean
}

export function InvoicePDF({ invoice, watermarkSettings, userTier = 'FREE', useKOR = false }: InvoicePDFProps) {
  // Get currency code, default to EUR
  const currencyCode = invoice.currencyCode || "EUR"
  const isNonEur = currencyCode !== "EUR"
  const hasEurEquivalent = isNonEur && invoice.totalEur != null

  // Helper to format amounts in invoice currency
  const formatAmount = (amount: number) => {
    return currencyCode === "EUR"
      ? formatCurrency(amount)
      : formatCurrencyWithCode(amount, currencyCode)
  }

  // Group VAT by rate
  const vatByRate = invoice.items.reduce((acc, item) => {
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
            {invoice.company.companyLogo && (
              <View style={styles.logoContainer}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */}
                <Image
                  src={invoice.company.companyLogo.startsWith("http") 
                    ? invoice.company.companyLogo 
                    : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${invoice.company.companyLogo}`}
                  style={styles.logo}
                />
              </View>
            )}
            <Text style={styles.companyName}>{invoice.company.companyName}</Text>
            <Text style={styles.addressLine}>{invoice.company.companyAddress}</Text>
            <Text style={styles.addressLine}>
              {invoice.company.companyPostalCode} {invoice.company.companyCity}
            </Text>
            <Text style={styles.addressLine}>{invoice.company.companyEmail}</Text>
            {invoice.company.companyPhone && (
              <Text style={styles.addressLine}>{invoice.company.companyPhone}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTUUR</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Factuuradres</Text>
            {invoice.customer.companyName && (
              <Text style={styles.addressName}>{invoice.customer.companyName}</Text>
            )}
            <Text style={!invoice.customer.companyName ? styles.addressName : styles.addressLine}>
              {invoice.customer.name}
            </Text>
            <Text style={styles.addressLine}>{invoice.customer.address}</Text>
            <Text style={styles.addressLine}>
              {invoice.customer.postalCode} {invoice.customer.city}
            </Text>
            <Text style={styles.addressLine}>{invoice.customer.country}</Text>
            {invoice.customer.vatNumber && (
              <Text style={[styles.addressLine, { marginTop: 4, fontSize: 8 }]}>
                BTW: {invoice.customer.vatNumber}
              </Text>
            )}
          </View>
          <View style={styles.addressBlock} />
        </View>

        {/* Invoice info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Factuurdatum</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vervaldatum</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          {invoice.reference && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Referentie</Text>
              <Text style={styles.infoValue}>{invoice.reference}</Text>
            </View>
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
            {!useKOR && (
              <Text style={[styles.tableHeaderCell, styles.colVat]}>
                BTW
              </Text>
            )}
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Totaal
            </Text>
          </View>

          {/* Rows */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>
                {formatNumber(item.quantity, 2)} {item.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatAmount(item.unitPrice)}
              </Text>
              {!useKOR && (
                <Text style={[styles.tableCell, styles.colVat]}>
                  {item.vatRate}%
                </Text>
              )}
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatAmount(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>
              {formatAmount(invoice.subtotal)}
            </Text>
          </View>

          {useKOR ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>BTW (KOR)</Text>
              <Text style={styles.totalValue}>
                {formatAmount(0)}
              </Text>
            </View>
          ) : (
            Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
              <View key={rate} style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  BTW {rate}% over {formatAmount(subtotal)}
                </Text>
                <Text style={styles.totalValue}>
                  {formatAmount(vatAmount)}
                </Text>
              </View>
            ))
          )}

          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Totaal</Text>
            <Text style={styles.totalValueFinal}>
              {formatAmount(invoice.total)}
            </Text>
          </View>
        </View>

        {/* EUR Equivalent for non-EUR invoices */}
        {hasEurEquivalent && (
          <View style={styles.eurEquivalent}>
            <Text style={styles.eurEquivalentLabel}>EUR Equivalent</Text>
            <View style={styles.eurEquivalentRow}>
              <Text style={styles.eurEquivalentText}>Subtotaal</Text>
              <Text style={styles.eurEquivalentText}>
                {formatCurrency(invoice.subtotalEur!)}
              </Text>
            </View>
            <View style={styles.eurEquivalentRow}>
              <Text style={styles.eurEquivalentText}>BTW</Text>
              <Text style={styles.eurEquivalentText}>
                {formatCurrency(invoice.vatAmountEur!)}
              </Text>
            </View>
            <View style={styles.eurEquivalentRow}>
              <Text style={[styles.eurEquivalentText, { fontWeight: "bold" }]}>Totaal</Text>
              <Text style={[styles.eurEquivalentText, { fontWeight: "bold" }]}>
                {formatCurrency(invoice.totalEur!)}
              </Text>
            </View>
            <Text style={styles.eurEquivalentNote}>
              Koers: 1 EUR = {formatExchangeRate(invoice.exchangeRate!, 4)} {currencyCode}
              {invoice.exchangeRateSource === "ECB" && invoice.exchangeRateDate && (
                ` (ECB, ${formatDateLong(invoice.exchangeRateDate)})`
              )}
              {invoice.exchangeRateSource === "MANUAL" && " (Handmatig)"}
            </Text>
          </View>
        )}

        {/* KOR notice - legally required */}
        {useKOR && (
          <View style={styles.notes}>
            <Text style={styles.notesText}>
              Vrijgesteld van omzetbelasting op grond van de Kleineondernemersregeling (KOR).
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Opmerkingen</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.paymentInfo}>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>IBAN</Text>
              <Text style={styles.paymentValue}>{invoice.company.iban}</Text>
            </View>
            {!useKOR && (
              <View style={styles.paymentBlock}>
                <Text style={styles.paymentLabel}>BTW-nummer</Text>
                <Text style={styles.paymentValue}>{invoice.company.vatNumber}</Text>
              </View>
            )}
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>KvK-nummer</Text>
              <Text style={styles.paymentValue}>{invoice.company.kvkNumber}</Text>
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
