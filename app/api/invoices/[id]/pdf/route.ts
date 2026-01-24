import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePDF } from "@/components/invoices/invoice-pdf-template"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import type { InvoiceItem } from "@/types"

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    // Haal factuur op met alle relaties
    const invoice = await db.invoice.findUnique({
      where: { id, userId },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
        user: {
          select: {
            subscriptionTier: true,
            vatNumber: true,
            kvkNumber: true,
            iban: true,
            company: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Factuur niet gevonden" },
        { status: 404 }
      )
    }

    // Haal system settings op voor watermerk
    const settings = await db.systemSettings.findUnique({
      where: { id: 'default' },
    })

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
        companyName: invoice.user.company?.name ?? "",
        companyEmail: invoice.user.company?.email ?? "",
        companyPhone: invoice.user.company?.phone ?? null,
        companyAddress: invoice.user.company?.address ?? "",
        companyPostalCode: invoice.user.company?.postalCode ?? "",
        companyCity: invoice.user.company?.city ?? "",
        companyCountry: invoice.user.company?.country ?? "Nederland",
        companyLogo: invoice.user.company?.logo ?? null,
        vatNumber: invoice.user.vatNumber,
        kvkNumber: invoice.user.kvkNumber,
        iban: invoice.user.iban,
      },
    }

    // Genereer PDF met watermerk settings
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ 
        invoice: pdfData,
        watermarkSettings: settings,
        userTier: invoice.user.subscriptionTier || 'FREE',
      })
    )

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    // Check if this is a preview request (from iframe) or download
    const isPreview = request.headers.get("referer")?.includes("/facturen/")
    
    // Return PDF response
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isPreview 
          ? `inline; filename="factuur-${invoice.invoiceNumber}.pdf"`
          : `attachment; filename="factuur-${invoice.invoiceNumber}.pdf"`,
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
