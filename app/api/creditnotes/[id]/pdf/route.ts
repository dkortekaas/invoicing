import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { CreditNotePDF } from "@/components/creditnotes/credit-note-pdf-template"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic"

interface CreditNoteItem {
  description: string
  quantity: { toNumber: () => number }
  unit: string
  unitPrice: { toNumber: () => number }
  vatRate: { toNumber: () => number }
  subtotal: { toNumber: () => number }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()

    // Haal credit nota op met alle relaties
    const creditNote = await db.creditNote.findUnique({
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

    if (!creditNote) {
      return NextResponse.json(
        { error: "Credit nota niet gevonden" },
        { status: 404 }
      )
    }

    // Haal system settings op voor watermerk
    const settings = await db.systemSettings.findUnique({
      where: { id: 'default' },
    })

    // Bereid data voor PDF
    const pdfData = {
      creditNoteNumber: creditNote.creditNoteNumber,
      creditNoteDate: creditNote.creditNoteDate,
      reason: creditNote.reason,
      description: creditNote.description,
      notes: creditNote.notes,
      originalInvoiceNumber: creditNote.originalInvoiceNumber,
      subtotal: creditNote.subtotal.toNumber(),
      vatAmount: creditNote.vatAmount.toNumber(),
      total: creditNote.total.toNumber(),
      customer: {
        name: creditNote.customer.name,
        companyName: creditNote.customer.companyName,
        address: creditNote.customer.address,
        postalCode: creditNote.customer.postalCode,
        city: creditNote.customer.city,
        country: creditNote.customer.country,
        vatNumber: creditNote.customer.vatNumber,
      },
      items: creditNote.items.map((item: CreditNoteItem) => ({
        description: item.description,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        unitPrice: item.unitPrice.toNumber(),
        vatRate: item.vatRate.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      company: {
        companyName: creditNote.user.company?.name ?? "",
        companyEmail: creditNote.user.company?.email ?? "",
        companyPhone: creditNote.user.company?.phone ?? null,
        companyAddress: creditNote.user.company?.address ?? "",
        companyPostalCode: creditNote.user.company?.postalCode ?? "",
        companyCity: creditNote.user.company?.city ?? "",
        companyCountry: creditNote.user.company?.country ?? "Nederland",
        companyLogo: creditNote.user.company?.logo ?? null,
        vatNumber: creditNote.user.vatNumber,
        kvkNumber: creditNote.user.kvkNumber,
        iban: creditNote.user.iban,
      },
    }

    // Genereer PDF met watermerk settings
    const pdfBuffer = await renderToBuffer(
      CreditNotePDF({
        creditNote: pdfData,
        watermarkSettings: settings,
        userTier: creditNote.user.subscriptionTier || 'FREE',
      })
    )

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    // Check if this is a preview request (from iframe) or download
    const isPreview = request.headers.get("referer")?.includes("/creditnotas/")

    // Return PDF response
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isPreview
          ? `inline; filename="creditnota-${creditNote.creditNoteNumber}.pdf"`
          : `attachment; filename="creditnota-${creditNote.creditNoteNumber}.pdf"`,
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
