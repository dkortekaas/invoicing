import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePDF } from "@/components/invoices/invoice-pdf-template"
import { db } from "@/lib/db"
import { TEMP_USER_ID } from "@/lib/server-utils"
import type { InvoiceItem } from "@/types"

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Haal factuur op met alle relaties
    const invoice = await db.invoice.findUnique({
      where: { id, userId: TEMP_USER_ID },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
        user: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Factuur niet gevonden" },
        { status: 404 }
      )
    }

    // Bereid data voor PDF
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      reference: invoice.reference,
      notes: invoice.notes,
      subtotal: invoice.subtotal.toNumber(),
      vatAmount: invoice.vatAmount.toNumber(),
      total: invoice.total.toNumber(),
      customer: {
        name: invoice.customer.name,
        companyName: invoice.customer.companyName,
        address: invoice.customer.address,
        postalCode: invoice.customer.postalCode,
        city: invoice.customer.city,
        country: invoice.customer.country,
        vatNumber: invoice.customer.vatNumber,
      },
      items: invoice.items.map((item: InvoiceItem) => ({
        description: item.description,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        unitPrice: item.unitPrice.toNumber(),
        vatRate: item.vatRate.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      company: {
        companyName: invoice.user.companyName,
        companyEmail: invoice.user.companyEmail,
        companyPhone: invoice.user.companyPhone,
        companyAddress: invoice.user.companyAddress,
        companyPostalCode: invoice.user.companyPostalCode,
        companyCity: invoice.user.companyCity,
        companyCountry: invoice.user.companyCountry,
        vatNumber: invoice.user.vatNumber,
        kvkNumber: invoice.user.kvkNumber,
        iban: invoice.user.iban,
      },
    }

    // Genereer PDF
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ invoice: pdfData })
    )

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF response
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factuur-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Fout bij genereren PDF" },
      { status: 500 }
    )
  }
}
