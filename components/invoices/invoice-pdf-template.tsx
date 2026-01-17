import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer"
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils"

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
})

interface InvoicePDFProps {
  invoice: InvoiceData
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {invoice.company.companyLogo && (
              <View style={styles.logoContainer}>
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
            <Text style={[styles.tableHeaderCell, styles.colVat]}>
              BTW
            </Text>
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
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.colVat]}>
                {item.vatRate}%
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>

          {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
            <View key={rate} style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                BTW {rate}% over {formatCurrency(subtotal)}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(vatAmount)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Totaal</Text>
            <Text style={styles.totalValueFinal}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

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
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>BTW-nummer</Text>
              <Text style={styles.paymentValue}>{invoice.company.vatNumber}</Text>
            </View>
            <View style={styles.paymentBlock}>
              <Text style={styles.paymentLabel}>KvK-nummer</Text>
              <Text style={styles.paymentValue}>{invoice.company.kvkNumber}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
