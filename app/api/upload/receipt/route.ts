import { NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const expenseId = formData.get("expenseId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 })
    }

    // Validate file type - allow PDF, images, and common document formats
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Alleen PDF, afbeeldingen (PNG, JPEG, WebP) of Word documenten zijn toegestaan" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Bestand is te groot. Maximum 5MB toegestaan" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `receipts/${userId}-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // The blob.url is the full URL to the uploaded file
    const receiptUrl = blob.url

    // If expenseId is provided, update the expense with the receipt
    if (expenseId) {
      // Check if expense belongs to user
      const expense = await db.expense.findFirst({
        where: {
          id: expenseId,
          userId: userId,
        },
      })

      if (expense) {
        // Delete old receipt from Vercel Blob if it exists
        if (expense.receipt && expense.receipt.includes("blob.vercel-storage.com")) {
          try {
            await del(expense.receipt)
          } catch (error) {
            // Ignore errors if file doesn't exist
            console.error("Error deleting old receipt:", error)
          }
        }

        // Update expense with new receipt
        await db.expense.update({
          where: { id: expenseId },
          data: { receipt: receiptUrl },
        })
      }
    }

    return NextResponse.json({ url: receiptUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Fout bij uploaden bestand" },
      { status: 500 }
    )
  }
}
