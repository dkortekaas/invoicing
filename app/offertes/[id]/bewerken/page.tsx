import { notFound } from "next/navigation"
import { QuoteForm } from "@/components/quotes/quote-form"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { getActiveProducts } from "@/app/producten/actions"
import { getFiscalSettings } from "@/app/instellingen/actions"
import { getQuoteForEdit } from "@/app/offertes/actions"
import { T } from "@/components/t"

export const dynamic = "force-dynamic"

interface BewerkOffertePageProps {
  params: Promise<{ id: string }>
}

export default async function BewerkOffertePage({ params }: BewerkOffertePageProps) {
  const { id } = await params

  const [quote, customers, products, fiscalSettings] = await Promise.all([
    getQuoteForEdit(id),
    getCustomersForDropdown(),
    getActiveProducts(),
    getFiscalSettings(),
  ])

  if (!quote) notFound()

  // Geblokkeerd bewerken als al ondertekend of geconverteerd
  if (quote.status === "SIGNED" || quote.status === "CONVERTED") {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight"><T ns="quotesPage" k="editBlockedTitle" /></h2>
        <p className="text-muted-foreground text-red-600">
          {quote.status === "SIGNED"
            ? <T ns="quotesPage" k="editBlockedSignedDesc" />
            : <T ns="quotesPage" k="editBlockedConvertedDesc" />
          }
        </p>
      </div>
    )
  }

  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    paymentTermDays: c.paymentTermDays,
  }))

  const productsForForm = products.map((p: typeof products[0]) => ({
    id: p.id,
    name: p.name,
    unitPrice: Number(p.unitPrice),
    vatRate: Number(p.vatRate),
    unit: p.unit,
  }))

  // Prisma Decimal → number voor het formulier
  const quoteForForm = {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    customerId: quote.customerId,
    quoteDate: quote.quoteDate,
    expiryDate: quote.expiryDate ?? null,
    reference: quote.reference ?? null,
    notes: quote.notes ?? null,
    internalNotes: quote.internalNotes ?? null,
    currencyCode: quote.currencyCode,
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      unit: item.unit,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <T ns="quotesPage" k="editQuoteTitle" vars={{ number: quote.quoteNumber }} />
        </h2>
        <p className="text-muted-foreground"><T ns="quotesPage" k="editQuoteDescription" /></p>
      </div>

      <QuoteForm
        quote={quoteForForm}
        customers={customersForForm}
        products={productsForForm}
        useKOR={fiscalSettings.useKOR}
      />
    </div>
  )
}
