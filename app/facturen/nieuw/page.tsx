import { InvoiceForm } from "@/components/invoices/invoice-form"

// Placeholder data - wordt later uit database gehaald
const customers = [
  {
    id: "1",
    name: "Jan Janssen",
    companyName: "Acme B.V.",
    paymentTermDays: 30,
  },
  {
    id: "2",
    name: "Maria de Vries",
    companyName: "Tech Solutions",
    paymentTermDays: 14,
  },
  {
    id: "3",
    name: "Peter van den Berg",
    companyName: null,
    paymentTermDays: 30,
  },
]

const products = [
  {
    id: "1",
    name: "Consultancy",
    unitPrice: 95.0,
    vatRate: 21,
    unit: "uur",
  },
  {
    id: "2",
    name: "Ontwikkeling",
    unitPrice: 85.0,
    vatRate: 21,
    unit: "uur",
  },
  {
    id: "3",
    name: "Training",
    unitPrice: 750.0,
    vatRate: 21,
    unit: "dag",
  },
]

export default function NieuweFactuurPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nieuwe Factuur</h2>
        <p className="text-muted-foreground">
          Maak een nieuwe factuur aan
        </p>
      </div>

      <InvoiceForm customers={customers} products={products} />
    </div>
  )
}
